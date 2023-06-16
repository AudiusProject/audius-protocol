import { z } from 'zod';
import { developer_appsCreateWithoutBlocks_developer_apps_blocknumberToblocksInputObjectSchema } from './developer_appsCreateWithoutBlocks_developer_apps_blocknumberToblocksInput.schema';
import { developer_appsUncheckedCreateWithoutBlocks_developer_apps_blocknumberToblocksInputObjectSchema } from './developer_appsUncheckedCreateWithoutBlocks_developer_apps_blocknumberToblocksInput.schema';
import { developer_appsCreateOrConnectWithoutBlocks_developer_apps_blocknumberToblocksInputObjectSchema } from './developer_appsCreateOrConnectWithoutBlocks_developer_apps_blocknumberToblocksInput.schema';
import { developer_appsCreateManyBlocks_developer_apps_blocknumberToblocksInputEnvelopeObjectSchema } from './developer_appsCreateManyBlocks_developer_apps_blocknumberToblocksInputEnvelope.schema';
import { developer_appsWhereUniqueInputObjectSchema } from './developer_appsWhereUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.developer_appsUncheckedCreateNestedManyWithoutBlocks_developer_apps_blocknumberToblocksInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(
            () =>
              developer_appsCreateWithoutBlocks_developer_apps_blocknumberToblocksInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                developer_appsCreateWithoutBlocks_developer_apps_blocknumberToblocksInputObjectSchema,
            )
            .array(),
          z.lazy(
            () =>
              developer_appsUncheckedCreateWithoutBlocks_developer_apps_blocknumberToblocksInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                developer_appsUncheckedCreateWithoutBlocks_developer_apps_blocknumberToblocksInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () =>
              developer_appsCreateOrConnectWithoutBlocks_developer_apps_blocknumberToblocksInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                developer_appsCreateOrConnectWithoutBlocks_developer_apps_blocknumberToblocksInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(
          () =>
            developer_appsCreateManyBlocks_developer_apps_blocknumberToblocksInputEnvelopeObjectSchema,
        )
        .optional(),
      connect: z
        .union([
          z.lazy(() => developer_appsWhereUniqueInputObjectSchema),
          z.lazy(() => developer_appsWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const developer_appsUncheckedCreateNestedManyWithoutBlocks_developer_apps_blocknumberToblocksInputObjectSchema =
  Schema;
