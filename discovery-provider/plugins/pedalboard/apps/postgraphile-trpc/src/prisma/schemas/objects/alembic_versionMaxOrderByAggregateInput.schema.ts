import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.alembic_versionMaxOrderByAggregateInput> = z
  .object({
    version_num: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const alembic_versionMaxOrderByAggregateInputObjectSchema = Schema;
