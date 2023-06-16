import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.track_trending_scoresCreateManyInput> = z
  .object({
    track_id: z.number(),
    type: z.string(),
    genre: z.string().optional().nullable(),
    version: z.string(),
    time_range: z.string(),
    score: z.number(),
    created_at: z.coerce.date(),
  })
  .strict();

export const track_trending_scoresCreateManyInputObjectSchema = Schema;
