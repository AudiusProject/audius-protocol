import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.related_artistsOrderByWithRelationInput> = z
  .object({
    user_id: z.lazy(() => SortOrderSchema).optional(),
    related_artist_user_id: z.lazy(() => SortOrderSchema).optional(),
    score: z.lazy(() => SortOrderSchema).optional(),
    created_at: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const related_artistsOrderByWithRelationInputObjectSchema = Schema;
