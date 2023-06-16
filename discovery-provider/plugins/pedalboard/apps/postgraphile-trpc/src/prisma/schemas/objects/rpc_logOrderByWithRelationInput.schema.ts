import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.rpc_logOrderByWithRelationInput> = z
  .object({
    relayed_at: z.lazy(() => SortOrderSchema).optional(),
    from_wallet: z.lazy(() => SortOrderSchema).optional(),
    rpc: z.lazy(() => SortOrderSchema).optional(),
    sig: z.lazy(() => SortOrderSchema).optional(),
    relayed_by: z.lazy(() => SortOrderSchema).optional(),
    applied_at: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const rpc_logOrderByWithRelationInputObjectSchema = Schema;
