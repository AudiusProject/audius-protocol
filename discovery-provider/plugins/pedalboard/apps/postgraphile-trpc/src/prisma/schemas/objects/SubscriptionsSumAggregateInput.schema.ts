import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.SubscriptionsSumAggregateInputType> = z
  .object({
    blocknumber: z.literal(true).optional(),
    subscriber_id: z.literal(true).optional(),
    user_id: z.literal(true).optional(),
  })
  .strict();

export const SubscriptionsSumAggregateInputObjectSchema = Schema;
