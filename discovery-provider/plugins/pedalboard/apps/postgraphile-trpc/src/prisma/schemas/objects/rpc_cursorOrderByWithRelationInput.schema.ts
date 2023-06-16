import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.rpc_cursorOrderByWithRelationInput> = z
  .object({
    relayed_by: z.lazy(() => SortOrderSchema).optional(),
    relayed_at: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const rpc_cursorOrderByWithRelationInputObjectSchema = Schema;
