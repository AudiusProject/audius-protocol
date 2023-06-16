import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { associated_walletsCountOrderByAggregateInputObjectSchema } from './associated_walletsCountOrderByAggregateInput.schema';
import { associated_walletsAvgOrderByAggregateInputObjectSchema } from './associated_walletsAvgOrderByAggregateInput.schema';
import { associated_walletsMaxOrderByAggregateInputObjectSchema } from './associated_walletsMaxOrderByAggregateInput.schema';
import { associated_walletsMinOrderByAggregateInputObjectSchema } from './associated_walletsMinOrderByAggregateInput.schema';
import { associated_walletsSumOrderByAggregateInputObjectSchema } from './associated_walletsSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.associated_walletsOrderByWithAggregationInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      user_id: z.lazy(() => SortOrderSchema).optional(),
      wallet: z.lazy(() => SortOrderSchema).optional(),
      blockhash: z.lazy(() => SortOrderSchema).optional(),
      blocknumber: z.lazy(() => SortOrderSchema).optional(),
      is_current: z.lazy(() => SortOrderSchema).optional(),
      is_delete: z.lazy(() => SortOrderSchema).optional(),
      chain: z.lazy(() => SortOrderSchema).optional(),
      _count: z
        .lazy(() => associated_walletsCountOrderByAggregateInputObjectSchema)
        .optional(),
      _avg: z
        .lazy(() => associated_walletsAvgOrderByAggregateInputObjectSchema)
        .optional(),
      _max: z
        .lazy(() => associated_walletsMaxOrderByAggregateInputObjectSchema)
        .optional(),
      _min: z
        .lazy(() => associated_walletsMinOrderByAggregateInputObjectSchema)
        .optional(),
      _sum: z
        .lazy(() => associated_walletsSumOrderByAggregateInputObjectSchema)
        .optional(),
    })
    .strict();

export const associated_walletsOrderByWithAggregationInputObjectSchema = Schema;
