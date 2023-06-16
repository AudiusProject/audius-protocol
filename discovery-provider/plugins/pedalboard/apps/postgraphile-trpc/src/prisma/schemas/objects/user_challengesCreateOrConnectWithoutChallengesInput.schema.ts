import { z } from 'zod';
import { user_challengesWhereUniqueInputObjectSchema } from './user_challengesWhereUniqueInput.schema';
import { user_challengesCreateWithoutChallengesInputObjectSchema } from './user_challengesCreateWithoutChallengesInput.schema';
import { user_challengesUncheckedCreateWithoutChallengesInputObjectSchema } from './user_challengesUncheckedCreateWithoutChallengesInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_challengesCreateOrConnectWithoutChallengesInput> =
  z
    .object({
      where: z.lazy(() => user_challengesWhereUniqueInputObjectSchema),
      create: z.union([
        z.lazy(() => user_challengesCreateWithoutChallengesInputObjectSchema),
        z.lazy(
          () =>
            user_challengesUncheckedCreateWithoutChallengesInputObjectSchema,
        ),
      ]),
    })
    .strict();

export const user_challengesCreateOrConnectWithoutChallengesInputObjectSchema =
  Schema;
