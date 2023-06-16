import { z } from 'zod';
import { grantsCreateWithoutBlocks_grants_blocknumberToblocksInputObjectSchema } from './grantsCreateWithoutBlocks_grants_blocknumberToblocksInput.schema';
import { grantsUncheckedCreateWithoutBlocks_grants_blocknumberToblocksInputObjectSchema } from './grantsUncheckedCreateWithoutBlocks_grants_blocknumberToblocksInput.schema';
import { grantsCreateOrConnectWithoutBlocks_grants_blocknumberToblocksInputObjectSchema } from './grantsCreateOrConnectWithoutBlocks_grants_blocknumberToblocksInput.schema';
import { grantsUpsertWithWhereUniqueWithoutBlocks_grants_blocknumberToblocksInputObjectSchema } from './grantsUpsertWithWhereUniqueWithoutBlocks_grants_blocknumberToblocksInput.schema';
import { grantsCreateManyBlocks_grants_blocknumberToblocksInputEnvelopeObjectSchema } from './grantsCreateManyBlocks_grants_blocknumberToblocksInputEnvelope.schema';
import { grantsWhereUniqueInputObjectSchema } from './grantsWhereUniqueInput.schema';
import { grantsUpdateWithWhereUniqueWithoutBlocks_grants_blocknumberToblocksInputObjectSchema } from './grantsUpdateWithWhereUniqueWithoutBlocks_grants_blocknumberToblocksInput.schema';
import { grantsUpdateManyWithWhereWithoutBlocks_grants_blocknumberToblocksInputObjectSchema } from './grantsUpdateManyWithWhereWithoutBlocks_grants_blocknumberToblocksInput.schema';
import { grantsScalarWhereInputObjectSchema } from './grantsScalarWhereInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.grantsUncheckedUpdateManyWithoutBlocks_grants_blocknumberToblocksNestedInput> =
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
      upsert: z
        .union([
          z.lazy(
            () =>
              grantsUpsertWithWhereUniqueWithoutBlocks_grants_blocknumberToblocksInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                grantsUpsertWithWhereUniqueWithoutBlocks_grants_blocknumberToblocksInputObjectSchema,
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
      set: z
        .union([
          z.lazy(() => grantsWhereUniqueInputObjectSchema),
          z.lazy(() => grantsWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      disconnect: z
        .union([
          z.lazy(() => grantsWhereUniqueInputObjectSchema),
          z.lazy(() => grantsWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      delete: z
        .union([
          z.lazy(() => grantsWhereUniqueInputObjectSchema),
          z.lazy(() => grantsWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      connect: z
        .union([
          z.lazy(() => grantsWhereUniqueInputObjectSchema),
          z.lazy(() => grantsWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      update: z
        .union([
          z.lazy(
            () =>
              grantsUpdateWithWhereUniqueWithoutBlocks_grants_blocknumberToblocksInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                grantsUpdateWithWhereUniqueWithoutBlocks_grants_blocknumberToblocksInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(
            () =>
              grantsUpdateManyWithWhereWithoutBlocks_grants_blocknumberToblocksInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                grantsUpdateManyWithWhereWithoutBlocks_grants_blocknumberToblocksInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      deleteMany: z
        .union([
          z.lazy(() => grantsScalarWhereInputObjectSchema),
          z.lazy(() => grantsScalarWhereInputObjectSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const grantsUncheckedUpdateManyWithoutBlocks_grants_blocknumberToblocksNestedInputObjectSchema =
  Schema;
