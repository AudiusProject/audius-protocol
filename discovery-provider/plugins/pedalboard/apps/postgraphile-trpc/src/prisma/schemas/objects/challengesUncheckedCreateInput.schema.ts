import { z } from 'zod';
import { challengetypeSchema } from '../enums/challengetype.schema';
import { user_challengesUncheckedCreateNestedManyWithoutChallengesInputObjectSchema } from './user_challengesUncheckedCreateNestedManyWithoutChallengesInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.challengesUncheckedCreateInput> = z
  .object({
    id: z.string(),
    type: z.lazy(() => challengetypeSchema),
    amount: z.string(),
    active: z.boolean(),
    step_count: z.number().optional().nullable(),
    starting_block: z.number().optional().nullable(),
    user_challenges: z
      .lazy(
        () =>
          user_challengesUncheckedCreateNestedManyWithoutChallengesInputObjectSchema,
      )
      .optional(),
  })
  .strict();

export const challengesUncheckedCreateInputObjectSchema = Schema;
