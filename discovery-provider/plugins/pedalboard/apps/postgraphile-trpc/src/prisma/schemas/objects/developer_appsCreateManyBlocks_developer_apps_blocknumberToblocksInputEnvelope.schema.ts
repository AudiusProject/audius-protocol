import { z } from 'zod';
import { developer_appsCreateManyBlocks_developer_apps_blocknumberToblocksInputObjectSchema } from './developer_appsCreateManyBlocks_developer_apps_blocknumberToblocksInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.developer_appsCreateManyBlocks_developer_apps_blocknumberToblocksInputEnvelope> =
  z
    .object({
      data: z.union([
        z.lazy(
          () =>
            developer_appsCreateManyBlocks_developer_apps_blocknumberToblocksInputObjectSchema,
        ),
        z
          .lazy(
            () =>
              developer_appsCreateManyBlocks_developer_apps_blocknumberToblocksInputObjectSchema,
          )
          .array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const developer_appsCreateManyBlocks_developer_apps_blocknumberToblocksInputEnvelopeObjectSchema =
  Schema;
