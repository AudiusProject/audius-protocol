import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.User_tipsCountAggregateInputType> = z
  .object({
    slot: z.literal(true).optional(),
    signature: z.literal(true).optional(),
    sender_user_id: z.literal(true).optional(),
    receiver_user_id: z.literal(true).optional(),
    amount: z.literal(true).optional(),
    created_at: z.literal(true).optional(),
    updated_at: z.literal(true).optional(),
    _all: z.literal(true).optional(),
  })
  .strict();

export const User_tipsCountAggregateInputObjectSchema = Schema;
