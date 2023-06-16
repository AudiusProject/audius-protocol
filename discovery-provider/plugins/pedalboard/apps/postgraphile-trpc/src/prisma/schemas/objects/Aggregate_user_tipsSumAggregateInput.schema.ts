import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Aggregate_user_tipsSumAggregateInputType> = z
  .object({
    sender_user_id: z.literal(true).optional(),
    receiver_user_id: z.literal(true).optional(),
    amount: z.literal(true).optional(),
  })
  .strict();

export const Aggregate_user_tipsSumAggregateInputObjectSchema = Schema;
