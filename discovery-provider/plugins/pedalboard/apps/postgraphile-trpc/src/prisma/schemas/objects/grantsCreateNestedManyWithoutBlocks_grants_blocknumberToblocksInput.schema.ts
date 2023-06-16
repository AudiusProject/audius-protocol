import { z } from 'zod';
import { grantsCreateWithoutBlocks_grants_blocknumberToblocksInputObjectSchema } from './grantsCreateWithoutBlocks_grants_blocknumberToblocksInput.schema';
import { grantsUncheckedCreateWithoutBlocks_grants_blocknumberToblocksInputObjectSchema } from './grantsUncheckedCreateWithoutBlocks_grants_blocknumberToblocksInput.schema';
import { grantsCreateOrConnectWithoutBlocks_grants_blocknumberToblocksInputObjectSchema } from './grantsCreateOrConnectWithoutBlocks_grants_blocknumberToblocksInput.schema';
import { grantsCreateManyBlocks_grants_blocknumberToblocksInputEnvelopeObjectSchema } from './grantsCreateManyBlocks_grants_blocknumberToblocksInputEnvelope.schema';
import { grantsWhereUniqueInputObjectSchema } from './grantsWhereUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.grantsCreateNestedManyWithoutBlocks_grants_blocknumberToblocksInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(
            () =>
              grantsCreateWithoutBlocks_grants_blocknumberToblocksInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                grantsCreateWithoutBlocks_grants_blocknumberToblocksInputObjectSchema,
            )
            .array(),
          z.lazy(
            () =>
              grantsUncheckedCreateWithoutBlocks_grants_blocknumberToblocksInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                grantsUncheckedCreateWithoutBlocks_grants_blocknumberToblocksInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () =>
              grantsCreateOrConnectWithoutBlocks_grants_blocknumberToblocksInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                grantsCreateOrConnectWithoutBlocks_grants_blocknumberToblocksInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(
          () =>
            grantsCreateManyBlocks_grants_blocknumberToblocksInputEnvelopeObjectSchema,
        )
        .optional(),
      connect: z
        .union([
          z.lazy(() => grantsWhereUniqueInputObjectSchema),
          z.lazy(() => grantsWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const grantsCreateNestedManyWithoutBlocks_grants_blocknumberToblocksInputObjectSchema =
  Schema;
