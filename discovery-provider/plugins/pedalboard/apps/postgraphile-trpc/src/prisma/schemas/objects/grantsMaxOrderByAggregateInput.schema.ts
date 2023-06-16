import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.grantsMaxOrderByAggregateInput> = z
  .object({
    blockhash: z.lazy(() => SortOrderSchema).optional(),
    blocknumber: z.lazy(() => SortOrderSchema).optional(),
    grantee_address: z.lazy(() => SortOrderSchema).optional(),
    user_id: z.lazy(() => SortOrderSchema).optional(),
    is_revoked: z.lazy(() => SortOrderSchema).optional(),
    is_current: z.lazy(() => SortOrderSchema).optional(),
    is_approved: z.lazy(() => SortOrderSchema).optional(),
    updated_at: z.lazy(() => SortOrderSchema).optional(),
    created_at: z.lazy(() => SortOrderSchema).optional(),
    txhash: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const grantsMaxOrderByAggregateInputObjectSchema = Schema;
