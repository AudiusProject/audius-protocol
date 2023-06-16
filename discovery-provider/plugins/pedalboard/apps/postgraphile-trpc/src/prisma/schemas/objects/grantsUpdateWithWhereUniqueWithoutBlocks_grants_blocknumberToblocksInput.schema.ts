import { z } from 'zod';
import { grantsWhereUniqueInputObjectSchema } from './grantsWhereUniqueInput.schema';
import { grantsUpdateWithoutBlocks_grants_blocknumberToblocksInputObjectSchema } from './grantsUpdateWithoutBlocks_grants_blocknumberToblocksInput.schema';
import { grantsUncheckedUpdateWithoutBlocks_grants_blocknumberToblocksInputObjectSchema } from './grantsUncheckedUpdateWithoutBlocks_grants_blocknumberToblocksInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.grantsUpdateWithWhereUniqueWithoutBlocks_grants_blocknumberToblocksInput> =
  z
    .object({
      where: z.lazy(() => grantsWhereUniqueInputObjectSchema),
      data: z.union([
        z.lazy(
          () =>
            grantsUpdateWithoutBlocks_grants_blocknumberToblocksInputObjectSchema,
        ),
        z.lazy(
          () =>
            grantsUncheckedUpdateWithoutBlocks_grants_blocknumberToblocksInputObjectSchema,
        ),
      ]),
    })
    .strict();

export const grantsUpdateWithWhereUniqueWithoutBlocks_grants_blocknumberToblocksInputObjectSchema =
  Schema;
