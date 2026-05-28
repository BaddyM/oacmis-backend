import { Injectable } from '@nestjs/common';
import { LedgerSource, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

export interface LedgerWriteInput {
  accountId: string;
  // Signed amount: positive = inflow, negative = outflow.
  amount: number | Prisma.Decimal;
  occurredAt?: Date;
  source: LedgerSource;
  referenceId?: string | null;
  counterpartyAccountId?: string | null;
  description?: string | null;
  branchId?: string | null;
  createdById?: string | null;
}

@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  // Use this when you already have a Prisma transaction client (tx).
  // Always pass the tx so the entry rolls back with the originating write.
  write(
    tx: Prisma.TransactionClient | PrismaService,
    input: LedgerWriteInput,
  ) {
    return (tx as PrismaService).ledgerEntry.create({
      data: {
        accountId: input.accountId,
        amount: input.amount as any,
        occurredAt: input.occurredAt ?? new Date(),
        source: input.source,
        referenceId: input.referenceId ?? null,
        counterpartyAccountId: input.counterpartyAccountId ?? null,
        description: input.description ?? null,
        branchId: input.branchId ?? null,
        createdById: input.createdById ?? null,
      },
    });
  }

  // Convenience used when there's no existing transaction.
  async writeStandalone(input: LedgerWriteInput) {
    return this.write(this.prisma, input);
  }
}
