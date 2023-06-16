import { z } from 'zod';
import { user_challengesWhereUniqueInputObjectSchema } from './user_challengesWhereUniqueInput.schema';
import { user_challengesUpdateWithoutChallengesInputObjectSchema } from './user_challengesUpdateWithoutChallengesInput.schema';
import { user_challengesUncheckedUpdateWithoutChallengesInputObjectSchema } from './user_challengesUncheckedUpdateWithoutChallengesInput.schema';
import { user_challengesCreateWithoutChallengesInputObjectSchema } from './user_challengesCreateWithoutChallengesInput.schema';
import { user_challengesUncheckedCreateWithoutChallengesInputObjectSchema } from './user_challengesUncheckedCreateWithoutChallengesInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_challengesUpsertWithWhereUniqueWithoutChallengesInput> =
  z
    .object({
      where: z.lazy(() => user_challengesWhereUniqueInputObjectSchema),
      update: z.union([
        z.lazy(() => user_challengesUpdateWithoutChallengesInputObjectSchema),
        z.lazy(
          () =>
            user_challengesUncheckedUpdateWithoutChallengesInputObjectSchema,
        ),
      ]),
      create: z.union([
        z.lazy(() => user_challengesCreateWithoutChallengesInputObjectSchema),
        z.lazy(
          () =>
            user_challengesUncheckedCreateWithoutChallengesInputObjectSchema,
        ),
      ]),
    })
    .strict();

export const user_challengesUpsertWithWhereUniqueWithoutChallengesInputObjectSchema =
  Schema;
