import { z } from 'zod';
import { user_challengesWhereUniqueInputObjectSchema } from './user_challengesWhereUniqueInput.schema';
import { user_challengesUpdateWithoutChallengesInputObjectSchema } from './user_challengesUpdateWithoutChallengesInput.schema';
import { user_challengesUncheckedUpdateWithoutChallengesInputObjectSchema } from './user_challengesUncheckedUpdateWithoutChallengesInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_challengesUpdateWithWhereUniqueWithoutChallengesInput> =
  z
    .object({
      where: z.lazy(() => user_challengesWhereUniqueInputObjectSchema),
      data: z.union([
        z.lazy(() => user_challengesUpdateWithoutChallengesInputObjectSchema),
        z.lazy(
          () =>
            user_challengesUncheckedUpdateWithoutChallengesInputObjectSchema,
        ),
      ]),
    })
    .strict();

export const user_challengesUpdateWithWhereUniqueWithoutChallengesInputObjectSchema =
  Schema;
