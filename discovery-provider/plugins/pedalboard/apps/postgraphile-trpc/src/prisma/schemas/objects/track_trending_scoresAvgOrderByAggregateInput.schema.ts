import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.track_trending_scoresAvgOrderByAggregateInput> =
  z
    .object({
      track_id: z.lazy(() => SortOrderSchema).optional(),
      score: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const track_trending_scoresAvgOrderByAggregateInputObjectSchema = Schema;
