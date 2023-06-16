import { z } from 'zod';
import { grantsCreateManyBlocks_grants_blockhashToblocksInputObjectSchema } from './grantsCreateManyBlocks_grants_blockhashToblocksInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.grantsCreateManyBlocks_grants_blockhashToblocksInputEnvelope> =
  z
    .object({
      data: z.union([
        z.lazy(
          () =>
            grantsCreateManyBlocks_grants_blockhashToblocksInputObjectSchema,
        ),
        z
          .lazy(
            () =>
              grantsCreateManyBlocks_grants_blockhashToblocksInputObjectSchema,
          )
          .array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const grantsCreateManyBlocks_grants_blockhashToblocksInputEnvelopeObjectSchema =
  Schema;
