import { z } from 'zod';
import { challengesUpdateWithoutUser_challengesInputObjectSchema } from './challengesUpdateWithoutUser_challengesInput.schema';
import { challengesUncheckedUpdateWithoutUser_challengesInputObjectSchema } from './challengesUncheckedUpdateWithoutUser_challengesInput.schema';
import { challengesCreateWithoutUser_challengesInputObjectSchema } from './challengesCreateWithoutUser_challengesInput.schema';
import { challengesUncheckedCreateWithoutUser_challengesInputObjectSchema } from './challengesUncheckedCreateWithoutUser_challengesInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.challengesUpsertWithoutUser_challengesInput> = z
  .object({
    update: z.union([
      z.lazy(() => challengesUpdateWithoutUser_challengesInputObjectSchema),
      z.lazy(
        () => challengesUncheckedUpdateWithoutUser_challengesInputObjectSchema,
      ),
    ]),
    create: z.union([
      z.lazy(() => challengesCreateWithoutUser_challengesInputObjectSchema),
      z.lazy(
        () => challengesUncheckedCreateWithoutUser_challengesInputObjectSchema,
      ),
    ]),
  })
  .strict();

export const challengesUpsertWithoutUser_challengesInputObjectSchema = Schema;
