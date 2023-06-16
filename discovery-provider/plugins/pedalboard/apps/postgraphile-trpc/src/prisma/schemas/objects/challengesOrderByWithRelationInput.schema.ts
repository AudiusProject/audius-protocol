import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { user_challengesOrderByRelationAggregateInputObjectSchema } from './user_challengesOrderByRelationAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.challengesOrderByWithRelationInput> = z
  .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    type: z.lazy(() => SortOrderSchema).optional(),
    amount: z.lazy(() => SortOrderSchema).optional(),
    active: z.lazy(() => SortOrderSchema).optional(),
    step_count: z.lazy(() => SortOrderSchema).optional(),
    starting_block: z.lazy(() => SortOrderSchema).optional(),
    user_challenges: z
      .lazy(() => user_challengesOrderByRelationAggregateInputObjectSchema)
      .optional(),
  })
  .strict();

export const challengesOrderByWithRelationInputObjectSchema = Schema;
