import { z } from 'zod';
import { challengesWhereUniqueInputObjectSchema } from './challengesWhereUniqueInput.schema';
import { challengesCreateWithoutUser_challengesInputObjectSchema } from './challengesCreateWithoutUser_challengesInput.schema';
import { challengesUncheckedCreateWithoutUser_challengesInputObjectSchema } from './challengesUncheckedCreateWithoutUser_challengesInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.challengesCreateOrConnectWithoutUser_challengesInput> =
  z
    .object({
      where: z.lazy(() => challengesWhereUniqueInputObjectSchema),
      create: z.union([
        z.lazy(() => challengesCreateWithoutUser_challengesInputObjectSchema),
        z.lazy(
          () =>
            challengesUncheckedCreateWithoutUser_challengesInputObjectSchema,
        ),
      ]),
    })
    .strict();

export const challengesCreateOrConnectWithoutUser_challengesInputObjectSchema =
  Schema;
