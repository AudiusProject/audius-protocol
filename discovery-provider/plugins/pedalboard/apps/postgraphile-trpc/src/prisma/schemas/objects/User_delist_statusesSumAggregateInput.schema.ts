import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.User_delist_statusesSumAggregateInputType> = z
  .object({
    user_id: z.literal(true).optional(),
  })
  .strict();

export const User_delist_statusesSumAggregateInputObjectSchema = Schema;
