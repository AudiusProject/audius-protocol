import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.FollowsMinAggregateInputType> = z
  .object({
    blockhash: z.literal(true).optional(),
    blocknumber: z.literal(true).optional(),
    follower_user_id: z.literal(true).optional(),
    followee_user_id: z.literal(true).optional(),
    is_current: z.literal(true).optional(),
    is_delete: z.literal(true).optional(),
    created_at: z.literal(true).optional(),
    txhash: z.literal(true).optional(),
    slot: z.literal(true).optional(),
  })
  .strict();

export const FollowsMinAggregateInputObjectSchema = Schema;
