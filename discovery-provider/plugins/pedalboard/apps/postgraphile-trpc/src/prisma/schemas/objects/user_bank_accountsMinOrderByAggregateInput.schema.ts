import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_bank_accountsMinOrderByAggregateInput> = z
  .object({
    signature: z.lazy(() => SortOrderSchema).optional(),
    ethereum_address: z.lazy(() => SortOrderSchema).optional(),
    created_at: z.lazy(() => SortOrderSchema).optional(),
    bank_account: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const user_bank_accountsMinOrderByAggregateInputObjectSchema = Schema;
