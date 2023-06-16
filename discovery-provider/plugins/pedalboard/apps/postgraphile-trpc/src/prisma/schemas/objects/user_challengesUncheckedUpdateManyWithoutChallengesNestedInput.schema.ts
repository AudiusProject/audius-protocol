import { z } from 'zod';
import { user_challengesCreateWithoutChallengesInputObjectSchema } from './user_challengesCreateWithoutChallengesInput.schema';
import { user_challengesUncheckedCreateWithoutChallengesInputObjectSchema } from './user_challengesUncheckedCreateWithoutChallengesInput.schema';
import { user_challengesCreateOrConnectWithoutChallengesInputObjectSchema } from './user_challengesCreateOrConnectWithoutChallengesInput.schema';
import { user_challengesUpsertWithWhereUniqueWithoutChallengesInputObjectSchema } from './user_challengesUpsertWithWhereUniqueWithoutChallengesInput.schema';
import { user_challengesCreateManyChallengesInputEnvelopeObjectSchema } from './user_challengesCreateManyChallengesInputEnvelope.schema';
import { user_challengesWhereUniqueInputObjectSchema } from './user_challengesWhereUniqueInput.schema';
import { user_challengesUpdateWithWhereUniqueWithoutChallengesInputObjectSchema } from './user_challengesUpdateWithWhereUniqueWithoutChallengesInput.schema';
import { user_challengesUpdateManyWithWhereWithoutChallengesInputObjectSchema } from './user_challengesUpdateManyWithWhereWithoutChallengesInput.schema';
import { user_challengesScalarWhereInputObjectSchema } from './user_challengesScalarWhereInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_challengesUncheckedUpdateManyWithoutChallengesNestedInput> =
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
      upsert: z
        .union([
          z.lazy(
            () =>
              user_challengesUpsertWithWhereUniqueWithoutChallengesInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                user_challengesUpsertWithWhereUniqueWithoutChallengesInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(
          () => user_challengesCreateManyChallengesInputEnvelopeObjectSchema,
        )
        .optional(),
      set: z
        .union([
          z.lazy(() => user_challengesWhereUniqueInputObjectSchema),
          z.lazy(() => user_challengesWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      disconnect: z
        .union([
          z.lazy(() => user_challengesWhereUniqueInputObjectSchema),
          z.lazy(() => user_challengesWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      delete: z
        .union([
          z.lazy(() => user_challengesWhereUniqueInputObjectSchema),
          z.lazy(() => user_challengesWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      connect: z
        .union([
          z.lazy(() => user_challengesWhereUniqueInputObjectSchema),
          z.lazy(() => user_challengesWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      update: z
        .union([
          z.lazy(
            () =>
              user_challengesUpdateWithWhereUniqueWithoutChallengesInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                user_challengesUpdateWithWhereUniqueWithoutChallengesInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(
            () =>
              user_challengesUpdateManyWithWhereWithoutChallengesInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                user_challengesUpdateManyWithWhereWithoutChallengesInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      deleteMany: z
        .union([
          z.lazy(() => user_challengesScalarWhereInputObjectSchema),
          z.lazy(() => user_challengesScalarWhereInputObjectSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const user_challengesUncheckedUpdateManyWithoutChallengesNestedInputObjectSchema =
  Schema;
