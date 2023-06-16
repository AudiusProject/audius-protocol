import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Rewards_manager_backfill_txsMaxAggregateInputType> =
  z
    .object({
      signature: z.literal(true).optional(),
      slot: z.literal(true).optional(),
      created_at: z.literal(true).optional(),
    })
    .strict();

export const Rewards_manager_backfill_txsMaxAggregateInputObjectSchema = Schema;
