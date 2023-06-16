import { z } from 'zod';
import { challengesCreateWithoutUser_challengesInputObjectSchema } from './challengesCreateWithoutUser_challengesInput.schema';
import { challengesUncheckedCreateWithoutUser_challengesInputObjectSchema } from './challengesUncheckedCreateWithoutUser_challengesInput.schema';
import { challengesCreateOrConnectWithoutUser_challengesInputObjectSchema } from './challengesCreateOrConnectWithoutUser_challengesInput.schema';
import { challengesWhereUniqueInputObjectSchema } from './challengesWhereUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.challengesCreateNestedOneWithoutUser_challengesInput> =
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
      connect: z.lazy(() => challengesWhereUniqueInputObjectSchema).optional(),
    })
    .strict();

export const challengesCreateNestedOneWithoutUser_challengesInputObjectSchema =
  Schema;
