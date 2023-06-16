import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.audius_data_txsOrderByWithRelationInput> = z
  .object({
    signature: z.lazy(() => SortOrderSchema).optional(),
    slot: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const audius_data_txsOrderByWithRelationInputObjectSchema = Schema;
