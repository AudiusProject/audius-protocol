import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.trending_resultsCreateInput> = z
  .object({
    user_id: z.number(),
    id: z.string().optional().nullable(),
    rank: z.number(),
    type: z.string(),
    version: z.string(),
    week: z.coerce.date(),
  })
  .strict();

export const trending_resultsCreateInputObjectSchema = Schema;
