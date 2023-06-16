import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { challengesOrderByWithRelationInputObjectSchema } from './challengesOrderByWithRelationInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_challengesOrderByWithRelationInput> = z
  .object({
    challenge_id: z.lazy(() => SortOrderSchema).optional(),
    user_id: z.lazy(() => SortOrderSchema).optional(),
    specifier: z.lazy(() => SortOrderSchema).optional(),
    is_complete: z.lazy(() => SortOrderSchema).optional(),
    current_step_count: z.lazy(() => SortOrderSchema).optional(),
    completed_blocknumber: z.lazy(() => SortOrderSchema).optional(),
    challenges: z
      .lazy(() => challengesOrderByWithRelationInputObjectSchema)
      .optional(),
  })
  .strict();

export const user_challengesOrderByWithRelationInputObjectSchema = Schema;
