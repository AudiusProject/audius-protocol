import { z } from 'zod';
import { challengesCreateWithoutUser_challengesInputObjectSchema } from './challengesCreateWithoutUser_challengesInput.schema';
import { challengesUncheckedCreateWithoutUser_challengesInputObjectSchema } from './challengesUncheckedCreateWithoutUser_challengesInput.schema';
import { challengesCreateOrConnectWithoutUser_challengesInputObjectSchema } from './challengesCreateOrConnectWithoutUser_challengesInput.schema';
import { challengesUpsertWithoutUser_challengesInputObjectSchema } from './challengesUpsertWithoutUser_challengesInput.schema';
import { challengesWhereUniqueInputObjectSchema } from './challengesWhereUniqueInput.schema';
import { challengesUpdateWithoutUser_challengesInputObjectSchema } from './challengesUpdateWithoutUser_challengesInput.schema';
import { challengesUncheckedUpdateWithoutUser_challengesInputObjectSchema } from './challengesUncheckedUpdateWithoutUser_challengesInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.challengesUpdateOneRequiredWithoutUser_challengesNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => challengesCreateWithoutUser_challengesInputObjectSchema),
          z.lazy(
            () =>
              challengesUncheckedCreateWithoutUser_challengesInputObjectSchema,
          ),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(
          () =>
            challengesCreateOrConnectWithoutUser_challengesInputObjectSchema,
        )
        .optional(),
      upsert: z
        .lazy(() => challengesUpsertWithoutUser_challengesInputObjectSchema)
        .optional(),
      connect: z.lazy(() => challengesWhereUniqueInputObjectSchema).optional(),
      update: z
        .union([
          z.lazy(() => challengesUpdateWithoutUser_challengesInputObjectSchema),
          z.lazy(
            () =>
              challengesUncheckedUpdateWithoutUser_challengesInputObjectSchema,
          ),
        ])
        .optional(),
    })
    .strict();

export const challengesUpdateOneRequiredWithoutUser_challengesNestedInputObjectSchema =
  Schema;
