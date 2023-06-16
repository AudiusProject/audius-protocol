import { z } from 'zod';
import { blocksCreateWithoutDeveloper_apps_developer_apps_blocknumberToblocksInputObjectSchema } from './blocksCreateWithoutDeveloper_apps_developer_apps_blocknumberToblocksInput.schema';
import { blocksUncheckedCreateWithoutDeveloper_apps_developer_apps_blocknumberToblocksInputObjectSchema } from './blocksUncheckedCreateWithoutDeveloper_apps_developer_apps_blocknumberToblocksInput.schema';
import { blocksCreateOrConnectWithoutDeveloper_apps_developer_apps_blocknumberToblocksInputObjectSchema } from './blocksCreateOrConnectWithoutDeveloper_apps_developer_apps_blocknumberToblocksInput.schema';
import { blocksUpsertWithoutDeveloper_apps_developer_apps_blocknumberToblocksInputObjectSchema } from './blocksUpsertWithoutDeveloper_apps_developer_apps_blocknumberToblocksInput.schema';
import { blocksWhereUniqueInputObjectSchema } from './blocksWhereUniqueInput.schema';
import { blocksUpdateWithoutDeveloper_apps_developer_apps_blocknumberToblocksInputObjectSchema } from './blocksUpdateWithoutDeveloper_apps_developer_apps_blocknumberToblocksInput.schema';
import { blocksUncheckedUpdateWithoutDeveloper_apps_developer_apps_blocknumberToblocksInputObjectSchema } from './blocksUncheckedUpdateWithoutDeveloper_apps_developer_apps_blocknumberToblocksInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.blocksUpdateOneWithoutDeveloper_apps_developer_apps_blocknumberToblocksNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(
            () =>
              blocksCreateWithoutDeveloper_apps_developer_apps_blocknumberToblocksInputObjectSchema,
          ),
          z.lazy(
            () =>
              blocksUncheckedCreateWithoutDeveloper_apps_developer_apps_blocknumberToblocksInputObjectSchema,
          ),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(
          () =>
            blocksCreateOrConnectWithoutDeveloper_apps_developer_apps_blocknumberToblocksInputObjectSchema,
        )
        .optional(),
      upsert: z
        .lazy(
          () =>
            blocksUpsertWithoutDeveloper_apps_developer_apps_blocknumberToblocksInputObjectSchema,
        )
        .optional(),
      disconnect: z.boolean().optional(),
      delete: z.boolean().optional(),
      connect: z.lazy(() => blocksWhereUniqueInputObjectSchema).optional(),
      update: z
        .union([
          z.lazy(
            () =>
              blocksUpdateWithoutDeveloper_apps_developer_apps_blocknumberToblocksInputObjectSchema,
          ),
          z.lazy(
            () =>
              blocksUncheckedUpdateWithoutDeveloper_apps_developer_apps_blocknumberToblocksInputObjectSchema,
          ),
        ])
        .optional(),
    })
    .strict();

export const blocksUpdateOneWithoutDeveloper_apps_developer_apps_blocknumberToblocksNestedInputObjectSchema =
  Schema;
