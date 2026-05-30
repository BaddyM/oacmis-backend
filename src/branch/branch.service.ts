import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import {
    CreateStockTransferDto,
    UpsertBranchStockDto,
    CreateBulkStockTransferDto,
} from './dto/branch-stock.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BranchService {
    constructor(private readonly prisma: PrismaService) { }
    async create(createBranchDto: CreateBranchDto) {
        // If this branch is set as main, unset other main branches
        if (createBranchDto.isMainBranch) {
            await this.prisma.branch.updateMany({ where: { isMainBranch: true }, data: { isMainBranch: false } });
        }
        const data = await this.prisma.branch.create({
            data: createBranchDto,
        });
        return data;
    }

    async findAll(page: number, limit: number) {
        const data = await this.prisma.branch.findMany({
            skip: (page - 1),
            take: limit,
            orderBy: { createdAt: "desc" }
        });
        const total = await this.prisma.branch.count();
        const totalPages = Math.ceil(total / limit);
        return { data, totalPages };
    }

    async update(id: string, updateBranchDto: UpdateBranchDto) {
        // If this update marks the branch as main, clear other mains first
        if ((updateBranchDto as any).isMainBranch) {
            await this.prisma.branch.updateMany({ where: { isMainBranch: true }, data: { isMainBranch: false } });
        }
        const data = await this.prisma.branch.update({
            where: { id },
            data: updateBranchDto
        });
        return data;
    }

    async remove(id: string) {
        const data = await this.prisma.branch.update({
            where: { id },
            data: { isActive: true }
        });
        return data;
    }

    //Branch Stock
    async upsert_branch_stock(dto: UpsertBranchStockDto) {
        return this.prisma.branchStock.upsert({
            where: {
                branchId_productId: {
                    branchId: dto.branchId,
                    productId: dto.productId,
                },
            },
            create: {
                branchId: dto.branchId,
                productId: dto.productId,
                quantity: dto.quantity,
            },
            update: { quantity: dto.quantity },
        });
    }

    async list_branch_stock(branchId?: string) {
        return this.prisma.branchStock.findMany({
            where: branchId ? { branchId } : {},
            include: {
                product: true,
                branch: { select: { id: true, name: true } },
            },
            orderBy: [{ branchId: 'asc' }, { productId: 'asc' }],
        });
    }

    //Stock Transfers
    async create_stock_transfer(dto: CreateStockTransferDto) {
        if (dto.fromBranchId === dto.toBranchId) {
            throw new InternalServerErrorException(
                'Source and destination branches must differ',
            );
        }
        const source = await this.prisma.branchStock.findUnique({
            where: {
                branchId_productId: {
                    branchId: dto.fromBranchId,
                    productId: dto.productId,
                },
            },
        });
        if (!source || source.quantity < dto.quantity) {
            throw new InternalServerErrorException(
                'Insufficient stock at source branch',
            );
        }
        const transfer = await this.prisma.stockTransfer.create({
            data: {
                fromBranchId: dto.fromBranchId,
                toBranchId: dto.toBranchId,
                productId: dto.productId,
                quantity: dto.quantity,
                createdById: dto.createdById,
                notes: dto.notes,
            },
        });

        // If this transfer was marked as credit, create a payable record for the receiving branch
        if (dto.onCredit) {
            if (!dto.totalAmount || dto.totalAmount <= 0) {
                throw new BadRequestException('totalAmount is required and must be > 0 when onCredit is true');
            }

            await this.prisma.branchPayable.create({
                data: {
                    branchId: dto.toBranchId,
                    stockTransferId: transfer.id,
                    description: dto.notes || `Payable for transfer ${transfer.id}`,
                    totalAmount: dto.totalAmount,
                    outstanding: dto.totalAmount,
                    createdById: dto.createdById,
                },
            });
        }

        return transfer;
    }

    async create_bulk_stock_transfer(dto: CreateBulkStockTransferDto) {
        if (dto.fromBranchId === dto.toBranchId) {
            throw new InternalServerErrorException(
                'Source and destination branches must differ',
            );
        }

        if (!dto.items || dto.items.length === 0) {
            throw new BadRequestException('No items provided for bulk transfer');
        }

        // Validate source stock availability for each item
        let payableTotal = 0;
        for (const item of dto.items) {
            if (!item.quantity || item.quantity <= 0) {
                throw new BadRequestException('Transfer quantity must be greater than zero');
            }
            const source = await this.prisma.branchStock.findUnique({
                where: {
                    branchId_productId: {
                        branchId: dto.fromBranchId,
                        productId: item.productId,
                    },
                },
                include: { product: true }
            });
            if (!source || source.quantity < item.quantity) {
                throw new BadRequestException(
                    `Insufficient stock for product ${item.productId}. Available: ${source?.quantity || 0}`,
                );
            }
            if (dto.onCredit) {
                payableTotal += (source.product.price * item.quantity);
            }
        }

        // Create transfers in a transaction. Like single transfers, these are
        // created PENDING and move no stock until the receiving branch office
        // confirms each one (see complete_stock_transfer).
        return this.prisma.$transaction(async (tx) => {
            const createdTransfers: any[] = [];
            for (const item of dto.items) {
                const t = await tx.stockTransfer.create({
                    data: {
                        fromBranchId: dto.fromBranchId,
                        toBranchId: dto.toBranchId,
                        productId: item.productId,
                        quantity: item.quantity,
                        createdById: dto.createdById,
                        status: 'PENDING',
                        notes: dto.notes,
                    },
                });
                createdTransfers.push(t);
            }

            let payable: any = null;
            if (dto.onCredit) {
                payable = await tx.branchPayable.create({
                    data: {
                        branchId: dto.toBranchId,
                        // bulk transfer uses no single stockTransferId; keep null
                        description: dto.notes || `Payable for bulk transfer (${createdTransfers.length} items)`,
                        totalAmount: payableTotal,
                        outstanding: payableTotal,
                        createdById: dto.createdById,
                    },
                });
            }

            return { transfers: createdTransfers, payable };
        });
    }

    async complete_stock_transfer(id: string, actorId?: string) {
        const transfer = await this.prisma.stockTransfer.findUnique({
            where: { id },
        });
        if (!transfer) {
            throw new InternalServerErrorException('Transfer not found');
        }
        if (transfer.status !== 'PENDING') {
            throw new InternalServerErrorException(
                'Transfer is not pending',
            );
        }

        // Only the office account of the receiving branch may confirm an incoming
        // transfer; admins can confirm as an override. Confirming reconciles stock.
        const actor = actorId
            ? await this.prisma.user.findUnique({
                  where: { id: actorId },
                  select: { id: true, role: true, branchId: true },
              })
            : null;
        if (!actor) {
            throw new UnauthorizedException('User not authorized');
        }
        const isAdmin = actor.role === 'admin';
        const isReceivingOffice =
            actor.role === 'office' && actor.branchId === transfer.toBranchId;
        if (!isAdmin && !isReceivingOffice) {
            throw new ForbiddenException(
                'Only the receiving branch office (or an admin) can confirm this transfer',
            );
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.branchStock.update({
                where: {
                    branchId_productId: {
                        branchId: transfer.fromBranchId,
                        productId: transfer.productId,
                    },
                },
                data: { quantity: { decrement: transfer.quantity } },
            });
            await tx.branchStock.upsert({
                where: {
                    branchId_productId: {
                        branchId: transfer.toBranchId,
                        productId: transfer.productId,
                    },
                },
                create: {
                    branchId: transfer.toBranchId,
                    productId: transfer.productId,
                    quantity: transfer.quantity,
                },
                update: { quantity: { increment: transfer.quantity } },
            });
            return tx.stockTransfer.update({
                where: { id },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                    completedById: actor.id,
                },
            });
        });
    }

    // Reverse a PENDING transfer. Pending transfers have not moved any stock yet
    // (stock only moves on completion), so cancelling just voids the record and any
    // credit payable that was opened with it. Completed transfers cannot be reversed
    // here because their stock has already been received.
    async cancel_stock_transfer(id: string, actorId?: string) {
        const actor = actorId
            ? await this.prisma.user.findUnique({
                  where: { id: actorId },
                  select: { id: true, role: true },
              })
            : null;
        if (!actor) {
            throw new UnauthorizedException('User not authorized');
        }
        if (actor.role !== 'admin') {
            throw new ForbiddenException('Only an admin can reverse a stock transfer');
        }

        const transfer = await this.prisma.stockTransfer.findUnique({
            where: { id },
            include: { payables: { include: { deposits: true } } },
        });
        if (!transfer) {
            throw new InternalServerErrorException('Transfer not found');
        }
        if (transfer.status !== 'PENDING') {
            throw new BadRequestException(
                'Only a pending transfer can be reversed',
            );
        }

        // A credit transfer opens a payable for the receiving branch. If the branch
        // has already paid against it, the transfer can't be cleanly voided.
        const paidPayable = transfer.payables.find((p) => p.deposits.length > 0);
        if (paidPayable) {
            throw new BadRequestException(
                'Cannot reverse — the receiving branch has already made a deposit against this transfer',
            );
        }

        return this.prisma.$transaction(async (tx) => {
            // Void any open payable(s) tied to this transfer.
            if (transfer.payables.length > 0) {
                await tx.branchPayable.updateMany({
                    where: { stockTransferId: transfer.id },
                    data: { status: 'CANCELLED', outstanding: 0 },
                });
            }

            return tx.stockTransfer.update({
                where: { id },
                data: { status: 'CANCELLED' },
            });
        });
    }

    async list_stock_transfers(branchId?: string) {
        return this.prisma.stockTransfer.findMany({
            where: branchId
                ? {
                      OR: [
                          { fromBranchId: branchId },
                          { toBranchId: branchId },
                      ],
                  }
                : {},
            include: {
                fromBranch: { select: { id: true, name: true } },
                toBranch: { select: { id: true, name: true } },
                product: true,
                createdBy: { select: { id: true, name: true, role: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}
