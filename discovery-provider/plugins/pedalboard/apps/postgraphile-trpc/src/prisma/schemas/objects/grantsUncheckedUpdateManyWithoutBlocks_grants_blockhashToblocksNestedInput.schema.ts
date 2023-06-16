import { z } from 'zod';
import { grantsCreateWithoutBlocks_grants_blockhashToblocksInputObjectSchema } from './grantsCreateWithoutBlocks_grants_blockhashToblocksInput.schema';
import { grantsUncheckedCreateWithoutBlocks_grants_blockhashToblocksInputObjectSchema } from './grantsUncheckedCreateWithoutBlocks_grants_blockhashToblocksInput.schema';
import { grantsCreateOrConnectWithoutBlocks_grants_blockhashToblocksInputObjectSchema } from './grantsCreateOrConnectWithoutBlocks_grants_blockhashToblocksInput.schema';
import { grantsUpsertWithWhereUniqueWithoutBlocks_grants_blockhashToblocksInputObjectSchema } from './grantsUpsertWithWhereUniqueWithoutBlocks_grants_blockhashToblocksInput.schema';
import { grantsCreateManyBlocks_grants_blockhashToblocksInputEnvelopeObjectSchema } from './grantsCreateManyBlocks_grants_blockhashToblocksInputEnvelope.schema';
import { grantsWhereUniqueInputObjectSchema } from './grantsWhereUniqueInput.schema';
import { grantsUpdateWithWhereUniqueWithoutBlocks_grants_blockhashToblocksInputObjectSchema } from './grantsUpdateWithWhereUniqueWithoutBlocks_grants_blockhashToblocksInput.schema';
import { grantsUpdateManyWithWhereWithoutBlocks_grants_blockhashToblocksInputObjectSchema } from './grantsUpdateManyWithWhereWithoutBlocks_grants_blockhashToblocksInput.schema';
import { grantsScalarWhereInputObjectSchema } from './grantsScalarWhereInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.grantsUncheckedUpdateManyWithoutBlocks_grants_blockhashToblocksNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(
            () =>
              grantsCreateWithoutBlocks_grants_blockhashToblocksInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                grantsCreateWithoutBlocks_grants_blockhashToblocksInputObjectSchema,
            )
            .array(),
          z.lazy(
            () =>
              grantsUncheckedCreateWithoutBlocks_grants_blockhashToblocksInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                grantsUncheckedCreateWithoutBlocks_grants_blockhashToblocksInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () =>
              grantsCreateOrConnectWithoutBlocks_grants_blockhashToblocksInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                grantsCreateOrConnectWithoutBlocks_grants_blockhashToblocksInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      upsert: z
        .union([
          z.lazy(
            () =>
              grantsUpsertWithWhereUniqueWithoutBlocks_grants_blockhashToblocksInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                grantsUpsertWithWhereUniqueWithoutBlocks_grants_blockhashToblocksInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(
          () =>
            grantsCreateManyBlocks_grants_blockhashToblocksInputEnvelopeObjectSchema,
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
              grantsUpdateWithWhereUniqueWithoutBlocks_grants_blockhashToblocksInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                grantsUpdateWithWhereUniqueWithoutBlocks_grants_blockhashToblocksInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(
            () =>
              grantsUpdateManyWithWhereWithoutBlocks_grants_blockhashToblocksInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                grantsUpdateManyWithWhereWithoutBlocks_grants_blockhashToblocksInputObjectSchema,
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

export const grantsUncheckedUpdateManyWithoutBlocks_grants_blockhashToblocksNestedInputObjectSchema =
  Schema;
