import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.FollowsSumAggregateInputType> = z
  .object({
    blocknumber: z.literal(true).optional(),
    follower_user_id: z.literal(true).optional(),
    followee_user_id: z.literal(true).optional(),
    slot: z.literal(true).optional(),
  })
  .strict();

export const FollowsSumAggregateInputObjectSchema = Schema;
