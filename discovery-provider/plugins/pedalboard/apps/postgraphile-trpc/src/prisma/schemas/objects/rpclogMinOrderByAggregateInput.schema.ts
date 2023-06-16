import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.rpclogMinOrderByAggregateInput> = z
  .object({
    cuid: z.lazy(() => SortOrderSchema).optional(),
    wallet: z.lazy(() => SortOrderSchema).optional(),
    method: z.lazy(() => SortOrderSchema).optional(),
    jetstream_seq: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const rpclogMinOrderByAggregateInputObjectSchema = Schema;
