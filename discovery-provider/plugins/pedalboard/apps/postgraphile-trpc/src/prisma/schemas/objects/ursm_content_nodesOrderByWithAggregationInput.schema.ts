import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { ursm_content_nodesCountOrderByAggregateInputObjectSchema } from './ursm_content_nodesCountOrderByAggregateInput.schema';
import { ursm_content_nodesAvgOrderByAggregateInputObjectSchema } from './ursm_content_nodesAvgOrderByAggregateInput.schema';
import { ursm_content_nodesMaxOrderByAggregateInputObjectSchema } from './ursm_content_nodesMaxOrderByAggregateInput.schema';
import { ursm_content_nodesMinOrderByAggregateInputObjectSchema } from './ursm_content_nodesMinOrderByAggregateInput.schema';
import { ursm_content_nodesSumOrderByAggregateInputObjectSchema } from './ursm_content_nodesSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.ursm_content_nodesOrderByWithAggregationInput> =
  z
    .object({
      blockhash: z.lazy(() => SortOrderSchema).optional(),
      blocknumber: z.lazy(() => SortOrderSchema).optional(),
      created_at: z.lazy(() => SortOrderSchema).optional(),
      is_current: z.lazy(() => SortOrderSchema).optional(),
      cnode_sp_id: z.lazy(() => SortOrderSchema).optional(),
      delegate_owner_wallet: z.lazy(() => SortOrderSchema).optional(),
      owner_wallet: z.lazy(() => SortOrderSchema).optional(),
      proposer_sp_ids: z.lazy(() => SortOrderSchema).optional(),
      proposer_1_delegate_owner_wallet: z
        .lazy(() => SortOrderSchema)
        .optional(),
      proposer_2_delegate_owner_wallet: z
        .lazy(() => SortOrderSchema)
        .optional(),
      proposer_3_delegate_owner_wallet: z
        .lazy(() => SortOrderSchema)
        .optional(),
      endpoint: z.lazy(() => SortOrderSchema).optional(),
      txhash: z.lazy(() => SortOrderSchema).optional(),
      slot: z.lazy(() => SortOrderSchema).optional(),
      _count: z
        .lazy(() => ursm_content_nodesCountOrderByAggregateInputObjectSchema)
        .optional(),
      _avg: z
        .lazy(() => ursm_content_nodesAvgOrderByAggregateInputObjectSchema)
        .optional(),
      _max: z
        .lazy(() => ursm_content_nodesMaxOrderByAggregateInputObjectSchema)
        .optional(),
      _min: z
        .lazy(() => ursm_content_nodesMinOrderByAggregateInputObjectSchema)
        .optional(),
      _sum: z
        .lazy(() => ursm_content_nodesSumOrderByAggregateInputObjectSchema)
        .optional(),
    })
    .strict();

export const ursm_content_nodesOrderByWithAggregationInputObjectSchema = Schema;
