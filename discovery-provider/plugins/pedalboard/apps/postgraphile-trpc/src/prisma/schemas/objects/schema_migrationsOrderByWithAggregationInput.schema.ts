import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { schema_migrationsCountOrderByAggregateInputObjectSchema } from './schema_migrationsCountOrderByAggregateInput.schema';
import { schema_migrationsMaxOrderByAggregateInputObjectSchema } from './schema_migrationsMaxOrderByAggregateInput.schema';
import { schema_migrationsMinOrderByAggregateInputObjectSchema } from './schema_migrationsMinOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.schema_migrationsOrderByWithAggregationInput> = z
  .object({
    version: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => schema_migrationsCountOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => schema_migrationsMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => schema_migrationsMinOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict();

export const schema_migrationsOrderByWithAggregationInputObjectSchema = Schema;
