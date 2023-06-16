import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.ursm_content_nodesMaxOrderByAggregateInput> = z
  .object({
    blockhash: z.lazy(() => SortOrderSchema).optional(),
    blocknumber: z.lazy(() => SortOrderSchema).optional(),
    created_at: z.lazy(() => SortOrderSchema).optional(),
    is_current: z.lazy(() => SortOrderSchema).optional(),
    cnode_sp_id: z.lazy(() => SortOrderSchema).optional(),
    delegate_owner_wallet: z.lazy(() => SortOrderSchema).optional(),
    owner_wallet: z.lazy(() => SortOrderSchema).optional(),
    proposer_1_delegate_owner_wallet: z.lazy(() => SortOrderSchema).optional(),
    proposer_2_delegate_owner_wallet: z.lazy(() => SortOrderSchema).optional(),
    proposer_3_delegate_owner_wallet: z.lazy(() => SortOrderSchema).optional(),
    endpoint: z.lazy(() => SortOrderSchema).optional(),
    txhash: z.lazy(() => SortOrderSchema).optional(),
    slot: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const ursm_content_nodesMaxOrderByAggregateInputObjectSchema = Schema;
