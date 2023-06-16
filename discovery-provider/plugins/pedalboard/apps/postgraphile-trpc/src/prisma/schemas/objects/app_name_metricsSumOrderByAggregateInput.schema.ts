import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.app_name_metricsSumOrderByAggregateInput> = z
  .object({
    count: z.lazy(() => SortOrderSchema).optional(),
    id: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const app_name_metricsSumOrderByAggregateInputObjectSchema = Schema;
