import { z } from 'zod';
import { developer_appsCreateWithoutBlocks_developer_apps_blocknumberToblocksInputObjectSchema } from './developer_appsCreateWithoutBlocks_developer_apps_blocknumberToblocksInput.schema';
import { developer_appsUncheckedCreateWithoutBlocks_developer_apps_blocknumberToblocksInputObjectSchema } from './developer_appsUncheckedCreateWithoutBlocks_developer_apps_blocknumberToblocksInput.schema';
import { developer_appsCreateOrConnectWithoutBlocks_developer_apps_blocknumberToblocksInputObjectSchema } from './developer_appsCreateOrConnectWithoutBlocks_developer_apps_blocknumberToblocksInput.schema';
import { developer_appsUpsertWithWhereUniqueWithoutBlocks_developer_apps_blocknumberToblocksInputObjectSchema } from './developer_appsUpsertWithWhereUniqueWithoutBlocks_developer_apps_blocknumberToblocksInput.schema';
import { developer_appsCreateManyBlocks_developer_apps_blocknumberToblocksInputEnvelopeObjectSchema } from './developer_appsCreateManyBlocks_developer_apps_blocknumberToblocksInputEnvelope.schema';
import { developer_appsWhereUniqueInputObjectSchema } from './developer_appsWhereUniqueInput.schema';
import { developer_appsUpdateWithWhereUniqueWithoutBlocks_developer_apps_blocknumberToblocksInputObjectSchema } from './developer_appsUpdateWithWhereUniqueWithoutBlocks_developer_apps_blocknumberToblocksInput.schema';
import { developer_appsUpdateManyWithWhereWithoutBlocks_developer_apps_blocknumberToblocksInputObjectSchema } from './developer_appsUpdateManyWithWhereWithoutBlocks_developer_apps_blocknumberToblocksInput.schema';
import { developer_appsScalarWhereInputObjectSchema } from './developer_appsScalarWhereInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.developer_appsUncheckedUpdateManyWithoutBlocks_developer_apps_blocknumberToblocksNestedInput> =
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
      upsert: z
        .union([
          z.lazy(
            () =>
              developer_appsUpsertWithWhereUniqueWithoutBlocks_developer_apps_blocknumberToblocksInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                developer_appsUpsertWithWhereUniqueWithoutBlocks_developer_apps_blocknumberToblocksInputObjectSchema,
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
      set: z
        .union([
          z.lazy(() => developer_appsWhereUniqueInputObjectSchema),
          z.lazy(() => developer_appsWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      disconnect: z
        .union([
          z.lazy(() => developer_appsWhereUniqueInputObjectSchema),
          z.lazy(() => developer_appsWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      delete: z
        .union([
          z.lazy(() => developer_appsWhereUniqueInputObjectSchema),
          z.lazy(() => developer_appsWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      connect: z
        .union([
          z.lazy(() => developer_appsWhereUniqueInputObjectSchema),
          z.lazy(() => developer_appsWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      update: z
        .union([
          z.lazy(
            () =>
              developer_appsUpdateWithWhereUniqueWithoutBlocks_developer_apps_blocknumberToblocksInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                developer_appsUpdateWithWhereUniqueWithoutBlocks_developer_apps_blocknumberToblocksInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(
            () =>
              developer_appsUpdateManyWithWhereWithoutBlocks_developer_apps_blocknumberToblocksInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                developer_appsUpdateManyWithWhereWithoutBlocks_developer_apps_blocknumberToblocksInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      deleteMany: z
        .union([
          z.lazy(() => developer_appsScalarWhereInputObjectSchema),
          z.lazy(() => developer_appsScalarWhereInputObjectSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const developer_appsUncheckedUpdateManyWithoutBlocks_developer_apps_blocknumberToblocksNestedInputObjectSchema =
  Schema;
