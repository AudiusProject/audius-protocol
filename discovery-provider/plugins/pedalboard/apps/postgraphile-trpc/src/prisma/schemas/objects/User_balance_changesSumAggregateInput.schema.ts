import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.User_balance_changesSumAggregateInputType> = z
  .object({
    user_id: z.literal(true).optional(),
    blocknumber: z.literal(true).optional(),
  })
  .strict();

export const User_balance_changesSumAggregateInputObjectSchema = Schema;
