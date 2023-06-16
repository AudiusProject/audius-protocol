import { z } from 'zod';
import { user_challengesCreateWithoutChallengesInputObjectSchema } from './user_challengesCreateWithoutChallengesInput.schema';
import { user_challengesUncheckedCreateWithoutChallengesInputObjectSchema } from './user_challengesUncheckedCreateWithoutChallengesInput.schema';
import { user_challengesCreateOrConnectWithoutChallengesInputObjectSchema } from './user_challengesCreateOrConnectWithoutChallengesInput.schema';
import { user_challengesCreateManyChallengesInputEnvelopeObjectSchema } from './user_challengesCreateManyChallengesInputEnvelope.schema';
import { user_challengesWhereUniqueInputObjectSchema } from './user_challengesWhereUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_challengesUncheckedCreateNestedManyWithoutChallengesInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => user_challengesCreateWithoutChallengesInputObjectSchema),
          z
            .lazy(() => user_challengesCreateWithoutChallengesInputObjectSchema)
            .array(),
          z.lazy(
            () =>
              user_challengesUncheckedCreateWithoutChallengesInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                user_challengesUncheckedCreateWithoutChallengesInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () =>
              user_challengesCreateOrConnectWithoutChallengesInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                user_challengesCreateOrConnectWithoutChallengesInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(
          () => user_challengesCreateManyChallengesInputEnvelopeObjectSchema,
        )
        .optional(),
      connect: z
        .union([
          z.lazy(() => user_challengesWhereUniqueInputObjectSchema),
          z.lazy(() => user_challengesWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const user_challengesUncheckedCreateNestedManyWithoutChallengesInputObjectSchema =
  Schema;
