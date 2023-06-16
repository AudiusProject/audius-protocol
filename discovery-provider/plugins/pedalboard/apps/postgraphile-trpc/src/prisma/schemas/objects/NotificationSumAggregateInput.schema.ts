import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.NotificationSumAggregateInputType> = z
  .object({
    id: z.literal(true).optional(),
    slot: z.literal(true).optional(),
    blocknumber: z.literal(true).optional(),
    user_ids: z.literal(true).optional(),
  })
  .strict();

export const NotificationSumAggregateInputObjectSchema = Schema;
