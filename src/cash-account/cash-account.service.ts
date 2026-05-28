import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LedgerSource, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { LedgerService } from './ledger.service';
import {
  CreateAdjustmentDto,
  CreateCashAccountDto,
  CreateTransferDto,
  UpdateCashAccountDto,
} from './dto/cash-account.dto';

@Injectable()
export class CashAccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
  ) {}

  // --- Accounts ---

  async create(dto: CreateCashAccountDto, createdById?: string) {
    return this.prisma.$transaction(async (tx) => {
      const account = await tx.cashAccount.create({
        data: {
          name: dto.name,
          type: dto.type,
          branchId: dto.branchId ?? null,
          currency: dto.currency ?? 'UGX',
          openingBalance: dto.openingBalance ?? 0,
          isActive: dto.isActive ?? true,
          notes: dto.notes ?? null,
        },
      });
      // Stamp the opening balance as a ledger entry so the running balance
      // calculation can always start from a known anchor.
      if (account.openingBalance && Number(account.openingBalance) !== 0) {
        await this.ledger.write(tx, {
          accountId: account.id,
          amount: Number(account.openingBalance),
          occurredAt: account.createdAt,
          source: LedgerSource.OPENING_BALANCE,
          description: 'Opening balance',
          branchId: account.branchId,
          createdById: createdById ?? null,
        });
      }
      return account;
    });
  }

  findAll(branchId?: string, activeOnly = false) {
    return this.prisma.cashAccount.findMany({
      where: {
        ...(branchId && branchId !== 'all' ? { branchId } : {}),
        ...(activeOnly ? { isActive: true } : {}),
      },
      include: { branch: { select: { id: true, name: true } } },
      orderBy: [{ branchId: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const account = await this.prisma.cashAccount.findUnique({
      where: { id },
      include: { branch: { select: { id: true, name: true } } },
    });
    if (!account) throw new NotFoundException('Cash account not found');
    return account;
  }

  async update(id: string, dto: UpdateCashAccountDto) {
    await this.findOne(id);
    // Don't allow editing openingBalance after the fact — would break the ledger.
    const { openingBalance: _ob, ...patch } = dto as any;
    return this.prisma.cashAccount.update({ where: { id }, data: patch });
  }

  async remove(id: string) {
    const account = await this.findOne(id);
    const entryCount = await this.prisma.ledgerEntry.count({ where: { accountId: id } });
    if (entryCount > 0) {
      throw new BadRequestException(
        'Cannot delete an account with ledger entries. Deactivate it instead.',
      );
    }
    return this.prisma.cashAccount.delete({ where: { id: account.id } });
  }

  // --- Balances ---

  async getBalance(id: string) {
    await this.findOne(id);
    const agg = await this.prisma.ledgerEntry.aggregate({
      where: { accountId: id },
      _sum: { amount: true },
    });
    const sum = Number(agg._sum.amount ?? 0);
    return { accountId: id, balance: sum };
  }

  async getAllBalances() {
    const accounts = await this.prisma.cashAccount.findMany({
      include: { branch: { select: { id: true, name: true } } },
      orderBy: [{ branchId: 'asc' }, { name: 'asc' }],
    });
    const grouped = await this.prisma.ledgerEntry.groupBy({
      by: ['accountId'],
      _sum: { amount: true },
    });
    const byAccount = new Map<string, number>();
    for (const g of grouped) byAccount.set(g.accountId, Number(g._sum.amount ?? 0));
    return accounts.map((a) => ({
      ...a,
      balance: byAccount.get(a.id) ?? Number(a.openingBalance ?? 0),
    }));
  }

  // --- Ledger ---

  async listEntries(
    accountId: string,
    opts: { page?: number; limit?: number; from?: string; to?: string } = {},
  ) {
    await this.findOne(accountId);
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(500, Math.max(1, opts.limit ?? 50));
    const where: Prisma.LedgerEntryWhereInput = {
      accountId,
      ...(opts.from || opts.to
        ? {
            occurredAt: {
              ...(opts.from ? { gte: new Date(opts.from) } : {}),
              ...(opts.to ? { lte: new Date(opts.to) } : {}),
            },
          }
        : {}),
    };
    const [entries, total, agg, runningPriorAgg] = await Promise.all([
      this.prisma.ledgerEntry.findMany({
        where,
        orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.ledgerEntry.count({ where }),
      this.prisma.ledgerEntry.aggregate({
        where: { accountId },
        _sum: { amount: true },
      }),
      this.prisma.ledgerEntry.aggregate({
        where: {
          accountId,
          ...(opts.to ? { occurredAt: { gt: new Date(opts.to) } } : {}),
        },
        _sum: { amount: true },
      }),
    ]);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    // Running balance "as of" each row (descending list): compute the balance
    // *after* the most recent row in the page, then subtract amounts going down.
    const balanceAfterAll = Number(agg._sum.amount ?? 0);
    const balanceAfterPeriodEnd = balanceAfterAll - Number(runningPriorAgg._sum.amount ?? 0);
    let running = balanceAfterPeriodEnd;
    // Newer entries on the page haven't been deducted yet from the period balance —
    // walk from the top: balance after that row = current running, then subtract its amount.
    const withRunning = entries.map((e) => {
      const balanceAfter = running;
      running = running - Number(e.amount);
      return { ...e, balanceAfter };
    });
    return {
      data: withRunning,
      page,
      totalPages,
      total,
      balance: balanceAfterAll,
    };
  }

  // --- Transfers between accounts ---

  async createTransfer(dto: CreateTransferDto, createdById?: string) {
    if (dto.fromAccountId === dto.toAccountId) {
      throw new BadRequestException('Source and destination must differ');
    }
    if (!dto.amount || dto.amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }
    const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();
    return this.prisma.$transaction(async (tx) => {
      const from = await tx.cashAccount.findUnique({ where: { id: dto.fromAccountId } });
      const to = await tx.cashAccount.findUnique({ where: { id: dto.toAccountId } });
      if (!from || !to) throw new NotFoundException('Account not found');
      const desc = dto.description ?? `Transfer ${from.name} → ${to.name}`;
      const out = await this.ledger.write(tx, {
        accountId: from.id,
        amount: -dto.amount,
        occurredAt,
        source: LedgerSource.TRANSFER,
        counterpartyAccountId: to.id,
        description: desc,
        branchId: from.branchId,
        createdById,
      });
      const inn = await this.ledger.write(tx, {
        accountId: to.id,
        amount: dto.amount,
        occurredAt,
        source: LedgerSource.TRANSFER,
        counterpartyAccountId: from.id,
        description: desc,
        branchId: to.branchId,
        createdById,
      });
      return { message: 'Transfer recorded', from: out, to: inn };
    });
  }

  // --- Manual adjustments (reconciliation corrections) ---

  async createAdjustment(dto: CreateAdjustmentDto, createdById?: string) {
    if (!dto.amount || dto.amount === 0) {
      throw new BadRequestException('Adjustment amount must be non-zero');
    }
    const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();
    return this.ledger.writeStandalone({
      accountId: dto.accountId,
      amount: dto.amount,
      occurredAt,
      source: LedgerSource.ADJUSTMENT,
      description: dto.description,
      createdById,
    });
  }
}
