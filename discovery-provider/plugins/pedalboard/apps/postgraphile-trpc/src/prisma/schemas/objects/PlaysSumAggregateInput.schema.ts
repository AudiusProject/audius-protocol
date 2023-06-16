import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.PlaysSumAggregateInputType> = z
  .object({
    id: z.literal(true).optional(),
    user_id: z.literal(true).optional(),
    play_item_id: z.literal(true).optional(),
    slot: z.literal(true).optional(),
  })
  .strict();

export const PlaysSumAggregateInputObjectSchema = Schema;
