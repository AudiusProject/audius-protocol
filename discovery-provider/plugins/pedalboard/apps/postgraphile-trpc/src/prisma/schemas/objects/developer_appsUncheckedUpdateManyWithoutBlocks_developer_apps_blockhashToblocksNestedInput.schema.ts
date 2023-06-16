import { z } from 'zod';
import { developer_appsCreateWithoutBlocks_developer_apps_blockhashToblocksInputObjectSchema } from './developer_appsCreateWithoutBlocks_developer_apps_blockhashToblocksInput.schema';
import { developer_appsUncheckedCreateWithoutBlocks_developer_apps_blockhashToblocksInputObjectSchema } from './developer_appsUncheckedCreateWithoutBlocks_developer_apps_blockhashToblocksInput.schema';
import { developer_appsCreateOrConnectWithoutBlocks_developer_apps_blockhashToblocksInputObjectSchema } from './developer_appsCreateOrConnectWithoutBlocks_developer_apps_blockhashToblocksInput.schema';
import { developer_appsUpsertWithWhereUniqueWithoutBlocks_developer_apps_blockhashToblocksInputObjectSchema } from './developer_appsUpsertWithWhereUniqueWithoutBlocks_developer_apps_blockhashToblocksInput.schema';
import { developer_appsCreateManyBlocks_developer_apps_blockhashToblocksInputEnvelopeObjectSchema } from './developer_appsCreateManyBlocks_developer_apps_blockhashToblocksInputEnvelope.schema';
import { developer_appsWhereUniqueInputObjectSchema } from './developer_appsWhereUniqueInput.schema';
import { developer_appsUpdateWithWhereUniqueWithoutBlocks_developer_apps_blockhashToblocksInputObjectSchema } from './developer_appsUpdateWithWhereUniqueWithoutBlocks_developer_apps_blockhashToblocksInput.schema';
import { developer_appsUpdateManyWithWhereWithoutBlocks_developer_apps_blockhashToblocksInputObjectSchema } from './developer_appsUpdateManyWithWhereWithoutBlocks_developer_apps_blockhashToblocksInput.schema';
import { developer_appsScalarWhereInputObjectSchema } from './developer_appsScalarWhereInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.developer_appsUncheckedUpdateManyWithoutBlocks_developer_apps_blockhashToblocksNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(
            () =>
              developer_appsCreateWithoutBlocks_developer_apps_blockhashToblocksInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                developer_appsCreateWithoutBlocks_developer_apps_blockhashToblocksInputObjectSchema,
            )
            .array(),
          z.lazy(
            () =>
              developer_appsUncheckedCreateWithoutBlocks_developer_apps_blockhashToblocksInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                developer_appsUncheckedCreateWithoutBlocks_developer_apps_blockhashToblocksInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () =>
              developer_appsCreateOrConnectWithoutBlocks_developer_apps_blockhashToblocksInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                developer_appsCreateOrConnectWithoutBlocks_developer_apps_blockhashToblocksInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      upsert: z
        .union([
          z.lazy(
            () =>
              developer_appsUpsertWithWhereUniqueWithoutBlocks_developer_apps_blockhashToblocksInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                developer_appsUpsertWithWhereUniqueWithoutBlocks_developer_apps_blockhashToblocksInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(
          () =>
            developer_appsCreateManyBlocks_developer_apps_blockhashToblocksInputEnvelopeObjectSchema,
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
              developer_appsUpdateWithWhereUniqueWithoutBlocks_developer_apps_blockhashToblocksInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                developer_appsUpdateWithWhereUniqueWithoutBlocks_developer_apps_blockhashToblocksInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(
            () =>
              developer_appsUpdateManyWithWhereWithoutBlocks_developer_apps_blockhashToblocksInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                developer_appsUpdateManyWithWhereWithoutBlocks_developer_apps_blockhashToblocksInputObjectSchema,
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

export const developer_appsUncheckedUpdateManyWithoutBlocks_developer_apps_blockhashToblocksNestedInputObjectSchema =
  Schema;
