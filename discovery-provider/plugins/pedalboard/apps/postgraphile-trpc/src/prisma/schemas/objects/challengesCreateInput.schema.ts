import { z } from 'zod';
import { challengetypeSchema } from '../enums/challengetype.schema';
import { user_challengesCreateNestedManyWithoutChallengesInputObjectSchema } from './user_challengesCreateNestedManyWithoutChallengesInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.challengesCreateInput> = z
  .object({
    id: z.string(),
    type: z.lazy(() => challengetypeSchema),
    amount: z.string(),
    active: z.boolean(),
    step_count: z.number().optional().nullable(),
    starting_block: z.number().optional().nullable(),
    user_challenges: z
      .lazy(
        () => user_challengesCreateNestedManyWithoutChallengesInputObjectSchema,
      )
      .optional(),
  })
  .strict();

export const challengesCreateInputObjectSchema = Schema;
