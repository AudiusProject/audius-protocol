import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_balancesOrderByWithRelationInput> = z
  .object({
    user_id: z.lazy(() => SortOrderSchema).optional(),
    balance: z.lazy(() => SortOrderSchema).optional(),
    created_at: z.lazy(() => SortOrderSchema).optional(),
    updated_at: z.lazy(() => SortOrderSchema).optional(),
    associated_wallets_balance: z.lazy(() => SortOrderSchema).optional(),
    waudio: z.lazy(() => SortOrderSchema).optional(),
    associated_sol_wallets_balance: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const user_balancesOrderByWithRelationInputObjectSchema = Schema;
