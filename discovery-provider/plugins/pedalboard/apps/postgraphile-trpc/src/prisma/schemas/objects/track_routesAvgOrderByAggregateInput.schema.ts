import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.track_routesAvgOrderByAggregateInput> = z
  .object({
    collision_id: z.lazy(() => SortOrderSchema).optional(),
    owner_id: z.lazy(() => SortOrderSchema).optional(),
    track_id: z.lazy(() => SortOrderSchema).optional(),
    blocknumber: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const track_routesAvgOrderByAggregateInputObjectSchema = Schema;
