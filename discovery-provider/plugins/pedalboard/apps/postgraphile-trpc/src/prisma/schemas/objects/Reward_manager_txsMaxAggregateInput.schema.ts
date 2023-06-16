import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Reward_manager_txsMaxAggregateInputType> = z
  .object({
    signature: z.literal(true).optional(),
    slot: z.literal(true).optional(),
    created_at: z.literal(true).optional(),
  })
  .strict();

export const Reward_manager_txsMaxAggregateInputObjectSchema = Schema;
