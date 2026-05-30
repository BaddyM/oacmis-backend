import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { LedgerSource } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { LedgerService } from 'src/cash-account/ledger.service';
import { CreateDepositDto } from './dto/create-deposit.dto';

type Actor = { id?: string; role?: string; branchId?: string };

@Injectable()
export class BranchPayablesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
  ) {}

  // Office (and any non-admin) may only touch payables for their own branch.
  private assertOwnsBranch(actor: Actor | undefined, branchId: string) {
    if (actor?.role === 'admin') return;
    if (!actor?.branchId || actor.branchId !== branchId) {
      throw new ForbiddenException(
        'You can only access branch payables for your own branch',
      );
    }
  }

  async list(page = 1, limit = 20, branchId?: string, startDate?: string, endDate?: string) {
    const where: any = {};
    if (branchId) where.branchId = branchId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const data = await this.prisma.branchPayable.findMany({
      where,
      include: { branch: true, deposits: true, stockTransfer: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const total = await this.prisma.branchPayable.count({ where });
    return { data, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, actor?: Actor) {
    const p = await this.prisma.branchPayable.findUnique({
      where: { id },
      include: { branch: true, deposits: { orderBy: { createdAt: 'desc' } }, stockTransfer: true },
    });
    if (!p) throw new NotFoundException('Payable not found');
    this.assertOwnsBranch(actor, p.branchId);
    return p;
  }

  async createDeposit(payableId: string, dto: CreateDepositDto, actor?: Actor) {
    const payable = await this.prisma.branchPayable.findUnique({ where: { id: payableId } });
    if (!payable) throw new NotFoundException('Payable not found');
    this.assertOwnsBranch(actor, payable.branchId);

    // A deposit must record both sides of the cash movement: the branch account the
    // money leaves and the HQ/main account it arrives in. Both must be supplied and
    // must reference real, distinct cash accounts.
    if (!dto.fromAccountId || !dto.toAccountId) {
      throw new BadRequestException(
        'Both a "from" (branch) and "to" (HQ) cash account are required to record a deposit',
      );
    }
    if (dto.fromAccountId === dto.toAccountId) {
      throw new BadRequestException('From and To accounts must differ');
    }
    const accountCount = await this.prisma.cashAccount.count({
      where: { id: { in: [dto.fromAccountId, dto.toAccountId] } },
    });
    if (accountCount < 2) {
      throw new BadRequestException('One or both selected cash accounts do not exist');
    }

    return this.prisma.$transaction(async (tx) => {
      const deposit = await tx.branchDeposit.create({
        data: {
          payableId,
          branchId: payable.branchId,
          amount: dto.amount,
          paymentMethod: dto.paymentMethod,
          reference: dto.reference,
          recordedById: dto.recordedById,
        },
      });

      // Cashbook: record movement.
      // - Both accounts supplied → TRANSFER pair (branch till → main account).
      // - Only from → BRANCH_DEPOSIT outflow on that account.
      // - Only to   → BRANCH_DEPOSIT inflow on that account.
      const description = `Branch deposit (payable ${payableId})`;
      if (dto.fromAccountId && dto.toAccountId) {
        if (dto.fromAccountId === dto.toAccountId) {
          throw new NotFoundException('From and To accounts must differ');
        }
        await this.ledger.write(tx, {
          accountId: dto.fromAccountId,
          amount: -Number(dto.amount),
          occurredAt: new Date(),
          source: LedgerSource.TRANSFER,
          referenceId: deposit.id,
          counterpartyAccountId: dto.toAccountId,
          description,
          branchId: payable.branchId,
          createdById: dto.recordedById,
        });
        await this.ledger.write(tx, {
          accountId: dto.toAccountId,
          amount: Number(dto.amount),
          occurredAt: new Date(),
          source: LedgerSource.TRANSFER,
          referenceId: deposit.id,
          counterpartyAccountId: dto.fromAccountId,
          description,
          createdById: dto.recordedById,
        });
      } else if (dto.fromAccountId) {
        await this.ledger.write(tx, {
          accountId: dto.fromAccountId,
          amount: -Number(dto.amount),
          occurredAt: new Date(),
          source: LedgerSource.BRANCH_DEPOSIT,
          referenceId: deposit.id,
          description,
          branchId: payable.branchId,
          createdById: dto.recordedById,
        });
      } else if (dto.toAccountId) {
        await this.ledger.write(tx, {
          accountId: dto.toAccountId,
          amount: Number(dto.amount),
          occurredAt: new Date(),
          source: LedgerSource.BRANCH_DEPOSIT,
          referenceId: deposit.id,
          description,
          createdById: dto.recordedById,
        });
      }

      const newOutstanding = Math.max(0, payable.outstanding - dto.amount);
      const newStatus = newOutstanding <= 0 ? 'PAID' : 'PARTIALLY_PAID';

      await tx.branchPayable.update({
        where: { id: payableId },
        data: { outstanding: newOutstanding, status: newStatus as any },
      });

      return deposit;
    });
  }
}
