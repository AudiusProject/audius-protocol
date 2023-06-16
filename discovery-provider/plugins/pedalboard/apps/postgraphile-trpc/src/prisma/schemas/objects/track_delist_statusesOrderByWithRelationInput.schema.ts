import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.track_delist_statusesOrderByWithRelationInput> =
  z
    .object({
      created_at: z.lazy(() => SortOrderSchema).optional(),
      track_id: z.lazy(() => SortOrderSchema).optional(),
      owner_id: z.lazy(() => SortOrderSchema).optional(),
      track_cid: z.lazy(() => SortOrderSchema).optional(),
      delisted: z.lazy(() => SortOrderSchema).optional(),
      reason: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const track_delist_statusesOrderByWithRelationInputObjectSchema = Schema;
