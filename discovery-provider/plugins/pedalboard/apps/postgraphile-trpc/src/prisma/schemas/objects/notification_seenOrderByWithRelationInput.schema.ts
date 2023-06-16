import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.notification_seenOrderByWithRelationInput> = z
  .object({
    user_id: z.lazy(() => SortOrderSchema).optional(),
    seen_at: z.lazy(() => SortOrderSchema).optional(),
    blocknumber: z.lazy(() => SortOrderSchema).optional(),
    blockhash: z.lazy(() => SortOrderSchema).optional(),
    txhash: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const notification_seenOrderByWithRelationInputObjectSchema = Schema;
