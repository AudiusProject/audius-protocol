import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Aggregate_user_tipsCountAggregateInputType> = z
  .object({
    sender_user_id: z.literal(true).optional(),
    receiver_user_id: z.literal(true).optional(),
    amount: z.literal(true).optional(),
    _all: z.literal(true).optional(),
  })
  .strict();

export const Aggregate_user_tipsCountAggregateInputObjectSchema = Schema;
