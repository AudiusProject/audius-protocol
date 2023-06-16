import { z } from 'zod';
import { developer_appsCreateWithoutBlocks_developer_apps_blockhashToblocksInputObjectSchema } from './developer_appsCreateWithoutBlocks_developer_apps_blockhashToblocksInput.schema';
import { developer_appsUncheckedCreateWithoutBlocks_developer_apps_blockhashToblocksInputObjectSchema } from './developer_appsUncheckedCreateWithoutBlocks_developer_apps_blockhashToblocksInput.schema';
import { developer_appsCreateOrConnectWithoutBlocks_developer_apps_blockhashToblocksInputObjectSchema } from './developer_appsCreateOrConnectWithoutBlocks_developer_apps_blockhashToblocksInput.schema';
import { developer_appsCreateManyBlocks_developer_apps_blockhashToblocksInputEnvelopeObjectSchema } from './developer_appsCreateManyBlocks_developer_apps_blockhashToblocksInputEnvelope.schema';
import { developer_appsWhereUniqueInputObjectSchema } from './developer_appsWhereUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.developer_appsUncheckedCreateNestedManyWithoutBlocks_developer_apps_blockhashToblocksInput> =
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
      createMany: z
        .lazy(
          () =>
            developer_appsCreateManyBlocks_developer_apps_blockhashToblocksInputEnvelopeObjectSchema,
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

export const developer_appsUncheckedCreateNestedManyWithoutBlocks_developer_apps_blockhashToblocksInputObjectSchema =
  Schema;
