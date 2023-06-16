import { z } from 'zod';
import { grantsWhereUniqueInputObjectSchema } from './grantsWhereUniqueInput.schema';
import { grantsUpdateWithoutBlocks_grants_blocknumberToblocksInputObjectSchema } from './grantsUpdateWithoutBlocks_grants_blocknumberToblocksInput.schema';
import { grantsUncheckedUpdateWithoutBlocks_grants_blocknumberToblocksInputObjectSchema } from './grantsUncheckedUpdateWithoutBlocks_grants_blocknumberToblocksInput.schema';
import { grantsCreateWithoutBlocks_grants_blocknumberToblocksInputObjectSchema } from './grantsCreateWithoutBlocks_grants_blocknumberToblocksInput.schema';
import { grantsUncheckedCreateWithoutBlocks_grants_blocknumberToblocksInputObjectSchema } from './grantsUncheckedCreateWithoutBlocks_grants_blocknumberToblocksInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.grantsUpsertWithWhereUniqueWithoutBlocks_grants_blocknumberToblocksInput> =
  z
    .object({
      where: z.lazy(() => grantsWhereUniqueInputObjectSchema),
      update: z.union([
        z.lazy(
          () =>
            grantsUpdateWithoutBlocks_grants_blocknumberToblocksInputObjectSchema,
        ),
        z.lazy(
          () =>
            grantsUncheckedUpdateWithoutBlocks_grants_blocknumberToblocksInputObjectSchema,
        ),
      ]),
      create: z.union([
        z.lazy(
          () =>
            grantsCreateWithoutBlocks_grants_blocknumberToblocksInputObjectSchema,
        ),
        z.lazy(
          () =>
            grantsUncheckedCreateWithoutBlocks_grants_blocknumberToblocksInputObjectSchema,
        ),
      ]),
    })
    .strict();

export const grantsUpsertWithWhereUniqueWithoutBlocks_grants_blocknumberToblocksInputObjectSchema =
  Schema;
