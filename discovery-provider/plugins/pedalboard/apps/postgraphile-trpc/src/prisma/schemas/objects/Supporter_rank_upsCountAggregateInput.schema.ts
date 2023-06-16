import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Supporter_rank_upsCountAggregateInputType> = z
  .object({
    slot: z.literal(true).optional(),
    sender_user_id: z.literal(true).optional(),
    receiver_user_id: z.literal(true).optional(),
    rank: z.literal(true).optional(),
    _all: z.literal(true).optional(),
  })
  .strict();

export const Supporter_rank_upsCountAggregateInputObjectSchema = Schema;
