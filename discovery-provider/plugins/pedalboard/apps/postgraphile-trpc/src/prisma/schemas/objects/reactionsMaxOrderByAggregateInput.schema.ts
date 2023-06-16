import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.reactionsMaxOrderByAggregateInput> = z
  .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    slot: z.lazy(() => SortOrderSchema).optional(),
    reaction_value: z.lazy(() => SortOrderSchema).optional(),
    sender_wallet: z.lazy(() => SortOrderSchema).optional(),
    reaction_type: z.lazy(() => SortOrderSchema).optional(),
    reacted_to: z.lazy(() => SortOrderSchema).optional(),
    timestamp: z.lazy(() => SortOrderSchema).optional(),
    tx_signature: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const reactionsMaxOrderByAggregateInputObjectSchema = Schema;
