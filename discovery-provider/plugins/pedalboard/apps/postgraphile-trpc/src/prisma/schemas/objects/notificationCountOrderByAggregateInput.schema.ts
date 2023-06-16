import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.notificationCountOrderByAggregateInput> = z
  .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    specifier: z.lazy(() => SortOrderSchema).optional(),
    group_id: z.lazy(() => SortOrderSchema).optional(),
    type: z.lazy(() => SortOrderSchema).optional(),
    slot: z.lazy(() => SortOrderSchema).optional(),
    blocknumber: z.lazy(() => SortOrderSchema).optional(),
    timestamp: z.lazy(() => SortOrderSchema).optional(),
    data: z.lazy(() => SortOrderSchema).optional(),
    user_ids: z.lazy(() => SortOrderSchema).optional(),
    type_v2: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const notificationCountOrderByAggregateInputObjectSchema = Schema;
