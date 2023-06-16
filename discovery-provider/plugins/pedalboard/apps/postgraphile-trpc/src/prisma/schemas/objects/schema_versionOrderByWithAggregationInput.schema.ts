import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { schema_versionCountOrderByAggregateInputObjectSchema } from './schema_versionCountOrderByAggregateInput.schema';
import { schema_versionMaxOrderByAggregateInputObjectSchema } from './schema_versionMaxOrderByAggregateInput.schema';
import { schema_versionMinOrderByAggregateInputObjectSchema } from './schema_versionMinOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.schema_versionOrderByWithAggregationInput> = z
  .object({
    file_name: z.lazy(() => SortOrderSchema).optional(),
    md5: z.lazy(() => SortOrderSchema).optional(),
    applied_at: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => schema_versionCountOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => schema_versionMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => schema_versionMinOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict();

export const schema_versionOrderByWithAggregationInputObjectSchema = Schema;
