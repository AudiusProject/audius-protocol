import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.User_bank_accountsCountAggregateInputType> = z
  .object({
    signature: z.literal(true).optional(),
    ethereum_address: z.literal(true).optional(),
    created_at: z.literal(true).optional(),
    bank_account: z.literal(true).optional(),
    _all: z.literal(true).optional(),
  })
  .strict();

export const User_bank_accountsCountAggregateInputObjectSchema = Schema;
