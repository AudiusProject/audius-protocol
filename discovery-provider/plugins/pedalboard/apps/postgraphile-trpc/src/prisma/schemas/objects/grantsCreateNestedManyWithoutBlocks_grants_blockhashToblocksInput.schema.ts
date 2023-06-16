import { z } from 'zod';
import { grantsCreateWithoutBlocks_grants_blockhashToblocksInputObjectSchema } from './grantsCreateWithoutBlocks_grants_blockhashToblocksInput.schema';
import { grantsUncheckedCreateWithoutBlocks_grants_blockhashToblocksInputObjectSchema } from './grantsUncheckedCreateWithoutBlocks_grants_blockhashToblocksInput.schema';
import { grantsCreateOrConnectWithoutBlocks_grants_blockhashToblocksInputObjectSchema } from './grantsCreateOrConnectWithoutBlocks_grants_blockhashToblocksInput.schema';
import { grantsCreateManyBlocks_grants_blockhashToblocksInputEnvelopeObjectSchema } from './grantsCreateManyBlocks_grants_blockhashToblocksInputEnvelope.schema';
import { grantsWhereUniqueInputObjectSchema } from './grantsWhereUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.grantsCreateNestedManyWithoutBlocks_grants_blockhashToblocksInput> =
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
      createMany: z
        .lazy(
          () =>
            grantsCreateManyBlocks_grants_blockhashToblocksInputEnvelopeObjectSchema,
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

export const grantsCreateNestedManyWithoutBlocks_grants_blockhashToblocksInputObjectSchema =
  Schema;
