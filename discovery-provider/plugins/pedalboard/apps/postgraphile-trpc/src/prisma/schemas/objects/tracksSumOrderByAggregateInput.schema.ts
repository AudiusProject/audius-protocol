import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.tracksSumOrderByAggregateInput> = z
  .object({
    track_id: z.lazy(() => SortOrderSchema).optional(),
    owner_id: z.lazy(() => SortOrderSchema).optional(),
    length: z.lazy(() => SortOrderSchema).optional(),
    blocknumber: z.lazy(() => SortOrderSchema).optional(),
    slot: z.lazy(() => SortOrderSchema).optional(),
    duration: z.lazy(() => SortOrderSchema).optional(),
    ai_attribution_user_id: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const tracksSumOrderByAggregateInputObjectSchema = Schema;
