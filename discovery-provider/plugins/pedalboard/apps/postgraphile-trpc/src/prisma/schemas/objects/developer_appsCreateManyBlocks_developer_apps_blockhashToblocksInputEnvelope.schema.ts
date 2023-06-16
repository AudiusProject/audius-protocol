import { z } from 'zod';
import { developer_appsCreateManyBlocks_developer_apps_blockhashToblocksInputObjectSchema } from './developer_appsCreateManyBlocks_developer_apps_blockhashToblocksInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.developer_appsCreateManyBlocks_developer_apps_blockhashToblocksInputEnvelope> =
  z
    .object({
      data: z.union([
        z.lazy(
          () =>
            developer_appsCreateManyBlocks_developer_apps_blockhashToblocksInputObjectSchema,
        ),
        z
          .lazy(
            () =>
              developer_appsCreateManyBlocks_developer_apps_blockhashToblocksInputObjectSchema,
          )
          .array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const developer_appsCreateManyBlocks_developer_apps_blockhashToblocksInputEnvelopeObjectSchema =
  Schema;
