import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.User_balance_changesMinAggregateInputType> = z
  .object({
    user_id: z.literal(true).optional(),
    blocknumber: z.literal(true).optional(),
    current_balance: z.literal(true).optional(),
    previous_balance: z.literal(true).optional(),
    created_at: z.literal(true).optional(),
    updated_at: z.literal(true).optional(),
  })
  .strict();

export const User_balance_changesMinAggregateInputObjectSchema = Schema;
