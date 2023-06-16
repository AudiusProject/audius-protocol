import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.related_artistsUncheckedCreateInput> = z
  .object({
    user_id: z.number(),
    related_artist_user_id: z.number(),
    score: z.number(),
    created_at: z.coerce.date().optional(),
  })
  .strict();

export const related_artistsUncheckedCreateInputObjectSchema = Schema;
