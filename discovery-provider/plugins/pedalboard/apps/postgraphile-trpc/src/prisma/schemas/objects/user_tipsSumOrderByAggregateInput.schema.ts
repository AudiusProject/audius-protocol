import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_tipsSumOrderByAggregateInput> = z
  .object({
    slot: z.lazy(() => SortOrderSchema).optional(),
    sender_user_id: z.lazy(() => SortOrderSchema).optional(),
    receiver_user_id: z.lazy(() => SortOrderSchema).optional(),
    amount: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const user_tipsSumOrderByAggregateInputObjectSchema = Schema;
