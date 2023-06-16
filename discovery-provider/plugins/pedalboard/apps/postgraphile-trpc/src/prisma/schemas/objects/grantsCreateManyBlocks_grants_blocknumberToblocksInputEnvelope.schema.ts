import { z } from 'zod';
import { grantsCreateManyBlocks_grants_blocknumberToblocksInputObjectSchema } from './grantsCreateManyBlocks_grants_blocknumberToblocksInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.grantsCreateManyBlocks_grants_blocknumberToblocksInputEnvelope> =
  z
    .object({
      data: z.union([
        z.lazy(
          () =>
            grantsCreateManyBlocks_grants_blocknumberToblocksInputObjectSchema,
        ),
        z
          .lazy(
            () =>
              grantsCreateManyBlocks_grants_blocknumberToblocksInputObjectSchema,
          )
          .array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const grantsCreateManyBlocks_grants_blocknumberToblocksInputEnvelopeObjectSchema =
  Schema;
