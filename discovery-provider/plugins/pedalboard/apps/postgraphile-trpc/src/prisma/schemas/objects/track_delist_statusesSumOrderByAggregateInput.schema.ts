import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.track_delist_statusesSumOrderByAggregateInput> =
  z
    .object({
      track_id: z.lazy(() => SortOrderSchema).optional(),
      owner_id: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const track_delist_statusesSumOrderByAggregateInputObjectSchema = Schema;
