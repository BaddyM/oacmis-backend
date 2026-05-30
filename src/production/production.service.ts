import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ProductionStatus } from '@prisma/client';
import { CreateProductionDto } from './dto/create-production.dto';
import { UpdateProductionDto } from './dto/update-production.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProductionService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveMainBranch(tx: any) {
    const mainBranch = await tx.branch.findFirst({
      where: {
        OR: [{ isMainBranch: true }, { name: 'Main' }],
      },
      select: { id: true, name: true },
    });

    if (!mainBranch) {
      throw new InternalServerErrorException('Main branch not found');
    }

    return mainBranch;
  }

  async create(createProductionDto: CreateProductionDto) {
    const quantity = Number(createProductionDto.quantity);
    if (!createProductionDto.productId || !Number.isFinite(quantity) || quantity <= 0) {
      throw new BadRequestException('Product and quantity are required');
    }

    const status: ProductionStatus = createProductionDto.status ?? ProductionStatus.EXPECTED;
    const subject = createProductionDto.subject?.trim() || null;
    // A subject-tagged run is a per-subject tracking record only — it never moves
    // sellable stock. Sellable stock is registered with subject-less complete-set runs.
    const affectsStock = !subject;

    return this.prisma.$transaction(async (tx) => {
      const mainBranch = await this.resolveMainBranch(tx);

      const product = await tx.product.findUnique({
        where: { id: createProductionDto.productId },
        select: { id: true, totalStock: true, price: true },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      // Only PRINTED, subject-less runs flow into inventory. EXPECTED rows are
      // forecast/planning only, and subject runs are per-subject tracking only.
      let updatedProduct = product;
      let mainBranchStock: any = null;
      if (status === ProductionStatus.PRINTED && affectsStock) {
        updatedProduct = await tx.product.update({
          where: { id: createProductionDto.productId },
          data: { totalStock: { increment: quantity } },
        });

        mainBranchStock = await tx.branchStock.upsert({
          where: {
            branchId_productId: {
              branchId: mainBranch.id,
              productId: createProductionDto.productId,
            },
          },
          create: {
            branchId: mainBranch.id,
            productId: createProductionDto.productId,
            quantity,
          },
          update: { quantity: { increment: quantity } },
        });
      }

      const production = await tx.production.create({
        data: {
          productId: createProductionDto.productId,
          branchId: mainBranch.id,
          quantity,
          // For a same-day printed batch the expected forecast and printed
          // amount are the same; for EXPECTED rows we leave printedQuantity
          // null until the user marks it printed.
          printedQuantity: status === ProductionStatus.PRINTED ? quantity : null,
          status,
          subject,
          term: createProductionDto.term ?? null,
          period: createProductionDto.period ?? null,
          printedAt: status === ProductionStatus.PRINTED ? new Date() : null,
          note: createProductionDto.note || null,
          createdById: createProductionDto.createdById || null,
        },
        include: {
          product: true,
          branch: true,
          createdBy: { select: { id: true, name: true, email: true } },
        },
      });

      return {
        message:
          status === ProductionStatus.PRINTED
            ? 'Production recorded and added to Main branch stock'
            : 'Expected production queued — mark as printed when produced',
        product: updatedProduct,
        mainBranch,
        mainBranchStock,
        production,
      };
    });
  }

  async createBulk(items: CreateProductionDto[]) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('items must be a non-empty array');
    }
    return this.prisma.$transaction(async (tx) => {
      const mainBranch = await this.resolveMainBranch(tx);
      const created: any[] = [];

      for (const dto of items) {
        const quantity = Number(dto.quantity);
        if (!dto.productId || !Number.isFinite(quantity) || quantity <= 0) {
          throw new BadRequestException('Each item needs a productId and positive quantity');
        }
        const status: ProductionStatus = dto.status ?? ProductionStatus.EXPECTED;
        const subject = dto.subject?.trim() || null;
        const affectsStock = !subject;

        if (status === ProductionStatus.PRINTED && affectsStock) {
          await tx.product.update({
            where: { id: dto.productId },
            data: { totalStock: { increment: quantity } },
          });
          await tx.branchStock.upsert({
            where: {
              branchId_productId: { branchId: mainBranch.id, productId: dto.productId },
            },
            create: { branchId: mainBranch.id, productId: dto.productId, quantity },
            update: { quantity: { increment: quantity } },
          });
        }

        const production = await tx.production.create({
          data: {
            productId: dto.productId,
            branchId: mainBranch.id,
            quantity,
            printedQuantity: status === ProductionStatus.PRINTED ? quantity : null,
            status,
            subject,
            term: dto.term ?? null,
            period: dto.period ?? null,
            printedAt: status === ProductionStatus.PRINTED ? new Date() : null,
            note: dto.note || null,
            createdById: dto.createdById || null,
          },
          include: {
            product: true,
            branch: true,
            createdBy: { select: { id: true, name: true, email: true } },
          },
        });
        created.push(production);
      }

      return { message: `${created.length} production run(s) recorded`, productions: created };
    });
  }

  async markPrinted(id: string, opts: { actualQuantity?: number; createdById?: string } = {}) {
    return this.prisma.$transaction(async (tx) => {
      return this.markPrintedInTx(tx, id, opts);
    });
  }

  // Shared logic so the bulk endpoint can wrap all updates in one transaction.
  private async markPrintedInTx(
    tx: any,
    id: string,
    opts: { actualQuantity?: number; createdById?: string } = {},
  ) {
    const existing = await tx.production.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Production run ${id} not found`);
    if (existing.status === ProductionStatus.PRINTED) {
      throw new BadRequestException(`Production run ${id} is already marked as printed`);
    }

    // The actual printed quantity may differ from the expected forecast — use it
    // for both the stored row and the stock increment if the caller supplies one.
    let printedQty = existing.quantity;
    if (opts.actualQuantity !== undefined && opts.actualQuantity !== null) {
      const n = Number(opts.actualQuantity);
      if (!Number.isFinite(n) || n <= 0) {
        throw new BadRequestException('actualQuantity must be a positive number');
      }
      printedQty = n;
    }

    // Subject-tagged runs are per-subject tracking only and never move stock —
    // marking one printed just records the printed quantity.
    if (!existing.subject) {
      const mainBranch = await this.resolveMainBranch(tx);

      await tx.product.update({
        where: { id: existing.productId },
        data: { totalStock: { increment: printedQty } },
      });

      await tx.branchStock.upsert({
        where: {
          branchId_productId: {
            branchId: mainBranch.id,
            productId: existing.productId,
          },
        },
        create: {
          branchId: mainBranch.id,
          productId: existing.productId,
          quantity: printedQty,
        },
        update: { quantity: { increment: printedQty } },
      });
    }

    return tx.production.update({
      where: { id },
      data: {
        status: ProductionStatus.PRINTED,
        printedAt: new Date(),
        // Preserve `quantity` as the original expected forecast and record the
        // actual printed amount in printedQuantity. Stock is incremented by
        // printedQty (above).
        printedQuantity: printedQty,
        ...(opts.createdById ? { createdById: opts.createdById } : {}),
      },
      include: {
        product: true,
        branch: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  // Revert a printed run. For subject-less runs this removes the quantity that was
  // added to inventory (product totalStock + Main branch stock); subject runs never
  // moved stock, so reverting only flips their status.
  async revertPrinted(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.production.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException(`Production run ${id} not found`);
      if (existing.status !== ProductionStatus.PRINTED) {
        throw new BadRequestException('Only printed runs can be reverted');
      }

      if (!existing.subject) {
        const reverseQty = existing.printedQuantity ?? existing.quantity;
        const mainBranch = await this.resolveMainBranch(tx);

        const product = await tx.product.findUnique({
          where: { id: existing.productId },
          select: { totalStock: true },
        });
        const mainStock = await tx.branchStock.findUnique({
          where: {
            branchId_productId: { branchId: mainBranch.id, productId: existing.productId },
          },
          select: { quantity: true },
        });
        if (
          (product?.totalStock ?? 0) < reverseQty ||
          (mainStock?.quantity ?? 0) < reverseQty
        ) {
          throw new BadRequestException(
            'Cannot revert — the printed stock has already been distributed or sold from Main branch',
          );
        }

        await tx.product.update({
          where: { id: existing.productId },
          data: { totalStock: { decrement: reverseQty } },
        });
        await tx.branchStock.update({
          where: {
            branchId_productId: { branchId: mainBranch.id, productId: existing.productId },
          },
          data: { quantity: { decrement: reverseQty } },
        });
      }

      return tx.production.update({
        where: { id },
        data: { status: ProductionStatus.REVERTED },
        include: {
          product: true,
          branch: true,
          createdBy: { select: { id: true, name: true, email: true } },
        },
      });
    });
  }

  async bulkMarkPrinted(
    items: Array<{ id: string; actualQuantity?: number }>,
    createdById?: string,
  ) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('items must be a non-empty array');
    }
    return this.prisma.$transaction(async (tx) => {
      const updated: any[] = [];
      for (const item of items) {
        if (!item?.id) throw new BadRequestException('Each item needs an id');
        updated.push(
          await this.markPrintedInTx(tx, item.id, {
            actualQuantity: item.actualQuantity,
            createdById,
          }),
        );
      }
      return { message: `${updated.length} run(s) marked as printed`, productions: updated };
    });
  }

  findAll(status?: ProductionStatus) {
    return this.prisma.production.findMany({
      where: status ? { status } : undefined,
      include: {
        product: true,
        branch: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: number) {
    return `Production record ${id} is not yet persisted`;
  }

  update(id: number, updateProductionDto: UpdateProductionDto) {
    return `Production record ${id} update is not yet persisted`;
  }

  async remove(id: string) {
    const existing = await this.prisma.production.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Production run not found');
    // Printed subject-tagged runs never entered stock, so they remain deletable.
    if (existing.status === ProductionStatus.PRINTED && !existing.subject) {
      throw new BadRequestException(
        'Cannot delete a printed run — quantity is already in stock',
      );
    }
    await this.prisma.production.delete({ where: { id } });
    return { message: 'Expected production cancelled' };
  }
}
