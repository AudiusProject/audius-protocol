import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.PlaysMinAggregateInputType> = z
  .object({
    id: z.literal(true).optional(),
    user_id: z.literal(true).optional(),
    source: z.literal(true).optional(),
    play_item_id: z.literal(true).optional(),
    created_at: z.literal(true).optional(),
    updated_at: z.literal(true).optional(),
    slot: z.literal(true).optional(),
    signature: z.literal(true).optional(),
    city: z.literal(true).optional(),
    region: z.literal(true).optional(),
    country: z.literal(true).optional(),
  })
  .strict();

export const PlaysMinAggregateInputObjectSchema = Schema;
