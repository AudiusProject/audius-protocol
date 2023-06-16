import { z } from 'zod';
import { user_challengesScalarWhereInputObjectSchema } from './user_challengesScalarWhereInput.schema';
import { user_challengesUpdateManyMutationInputObjectSchema } from './user_challengesUpdateManyMutationInput.schema';
import { user_challengesUncheckedUpdateManyWithoutUser_challengesInputObjectSchema } from './user_challengesUncheckedUpdateManyWithoutUser_challengesInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_challengesUpdateManyWithWhereWithoutChallengesInput> =
  z
    .object({
      where: z.lazy(() => user_challengesScalarWhereInputObjectSchema),
      data: z.union([
        z.lazy(() => user_challengesUpdateManyMutationInputObjectSchema),
        z.lazy(
          () =>
            user_challengesUncheckedUpdateManyWithoutUser_challengesInputObjectSchema,
        ),
      ]),
    })
    .strict();

export const user_challengesUpdateManyWithWhereWithoutChallengesInputObjectSchema =
  Schema;
