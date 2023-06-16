import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { blocksOrderByWithRelationInputObjectSchema } from './blocksOrderByWithRelationInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.developer_appsOrderByWithRelationInput> = z
  .object({
    address: z.lazy(() => SortOrderSchema).optional(),
    blockhash: z.lazy(() => SortOrderSchema).optional(),
    blocknumber: z.lazy(() => SortOrderSchema).optional(),
    user_id: z.lazy(() => SortOrderSchema).optional(),
    name: z.lazy(() => SortOrderSchema).optional(),
    is_personal_access: z.lazy(() => SortOrderSchema).optional(),
    is_delete: z.lazy(() => SortOrderSchema).optional(),
    created_at: z.lazy(() => SortOrderSchema).optional(),
    txhash: z.lazy(() => SortOrderSchema).optional(),
    is_current: z.lazy(() => SortOrderSchema).optional(),
    updated_at: z.lazy(() => SortOrderSchema).optional(),
    description: z.lazy(() => SortOrderSchema).optional(),
    blocks_developer_apps_blockhashToblocks: z
      .lazy(() => blocksOrderByWithRelationInputObjectSchema)
      .optional(),
    blocks_developer_apps_blocknumberToblocks: z
      .lazy(() => blocksOrderByWithRelationInputObjectSchema)
      .optional(),
  })
  .strict();

export const developer_appsOrderByWithRelationInputObjectSchema = Schema;
