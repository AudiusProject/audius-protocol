import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.schema_versionMaxOrderByAggregateInput> = z
  .object({
    file_name: z.lazy(() => SortOrderSchema).optional(),
    md5: z.lazy(() => SortOrderSchema).optional(),
    applied_at: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const schema_versionMaxOrderByAggregateInputObjectSchema = Schema;
