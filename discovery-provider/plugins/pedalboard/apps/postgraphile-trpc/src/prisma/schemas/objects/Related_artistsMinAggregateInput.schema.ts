import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Related_artistsMinAggregateInputType> = z
  .object({
    user_id: z.literal(true).optional(),
    related_artist_user_id: z.literal(true).optional(),
    score: z.literal(true).optional(),
    created_at: z.literal(true).optional(),
  })
  .strict();

export const Related_artistsMinAggregateInputObjectSchema = Schema;
