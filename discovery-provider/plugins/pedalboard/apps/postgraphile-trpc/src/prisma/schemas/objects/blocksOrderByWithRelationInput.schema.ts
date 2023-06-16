import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { developer_appsOrderByRelationAggregateInputObjectSchema } from './developer_appsOrderByRelationAggregateInput.schema';
import { grantsOrderByRelationAggregateInputObjectSchema } from './grantsOrderByRelationAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.blocksOrderByWithRelationInput> = z
  .object({
    blockhash: z.lazy(() => SortOrderSchema).optional(),
    parenthash: z.lazy(() => SortOrderSchema).optional(),
    is_current: z.lazy(() => SortOrderSchema).optional(),
    number: z.lazy(() => SortOrderSchema).optional(),
    developer_apps_developer_apps_blockhashToblocks: z
      .lazy(() => developer_appsOrderByRelationAggregateInputObjectSchema)
      .optional(),
    developer_apps_developer_apps_blocknumberToblocks: z
      .lazy(() => developer_appsOrderByRelationAggregateInputObjectSchema)
      .optional(),
    grants_grants_blockhashToblocks: z
      .lazy(() => grantsOrderByRelationAggregateInputObjectSchema)
      .optional(),
    grants_grants_blocknumberToblocks: z
      .lazy(() => grantsOrderByRelationAggregateInputObjectSchema)
      .optional(),
  })
  .strict();

export const blocksOrderByWithRelationInputObjectSchema = Schema;
