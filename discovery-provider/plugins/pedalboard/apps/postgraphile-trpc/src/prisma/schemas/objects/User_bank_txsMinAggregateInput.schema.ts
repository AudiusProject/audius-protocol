import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.User_bank_txsMinAggregateInputType> = z
  .object({
    signature: z.literal(true).optional(),
    slot: z.literal(true).optional(),
    created_at: z.literal(true).optional(),
  })
  .strict();

export const User_bank_txsMinAggregateInputObjectSchema = Schema;
