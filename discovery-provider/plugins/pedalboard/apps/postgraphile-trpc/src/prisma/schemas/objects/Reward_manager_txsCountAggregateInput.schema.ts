import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Reward_manager_txsCountAggregateInputType> = z
  .object({
    signature: z.literal(true).optional(),
    slot: z.literal(true).optional(),
    created_at: z.literal(true).optional(),
    _all: z.literal(true).optional(),
  })
  .strict();

export const Reward_manager_txsCountAggregateInputObjectSchema = Schema;
