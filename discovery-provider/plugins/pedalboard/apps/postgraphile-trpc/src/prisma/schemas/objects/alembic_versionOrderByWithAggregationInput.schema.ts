import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { alembic_versionCountOrderByAggregateInputObjectSchema } from './alembic_versionCountOrderByAggregateInput.schema';
import { alembic_versionMaxOrderByAggregateInputObjectSchema } from './alembic_versionMaxOrderByAggregateInput.schema';
import { alembic_versionMinOrderByAggregateInputObjectSchema } from './alembic_versionMinOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.alembic_versionOrderByWithAggregationInput> = z
  .object({
    version_num: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => alembic_versionCountOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => alembic_versionMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => alembic_versionMinOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict();

export const alembic_versionOrderByWithAggregationInputObjectSchema = Schema;
