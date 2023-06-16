import { z } from 'zod';
import { grantsWhereUniqueInputObjectSchema } from './grantsWhereUniqueInput.schema';
import { grantsCreateWithoutBlocks_grants_blocknumberToblocksInputObjectSchema } from './grantsCreateWithoutBlocks_grants_blocknumberToblocksInput.schema';
import { grantsUncheckedCreateWithoutBlocks_grants_blocknumberToblocksInputObjectSchema } from './grantsUncheckedCreateWithoutBlocks_grants_blocknumberToblocksInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.grantsCreateOrConnectWithoutBlocks_grants_blocknumberToblocksInput> =
  z
    .object({
      where: z.lazy(() => grantsWhereUniqueInputObjectSchema),
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

export const grantsCreateOrConnectWithoutBlocks_grants_blocknumberToblocksInputObjectSchema =
  Schema;
