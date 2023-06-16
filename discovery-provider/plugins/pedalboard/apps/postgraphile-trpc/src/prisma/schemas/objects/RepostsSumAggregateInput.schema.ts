import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.RepostsSumAggregateInputType> = z
  .object({
    blocknumber: z.literal(true).optional(),
    user_id: z.literal(true).optional(),
    repost_item_id: z.literal(true).optional(),
    slot: z.literal(true).optional(),
  })
  .strict();

export const RepostsSumAggregateInputObjectSchema = Schema;
