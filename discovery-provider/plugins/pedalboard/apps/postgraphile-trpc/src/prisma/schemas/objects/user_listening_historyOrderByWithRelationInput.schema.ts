import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_listening_historyOrderByWithRelationInput> =
  z
    .object({
      user_id: z.lazy(() => SortOrderSchema).optional(),
      listening_history: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const user_listening_historyOrderByWithRelationInputObjectSchema =
  Schema;
