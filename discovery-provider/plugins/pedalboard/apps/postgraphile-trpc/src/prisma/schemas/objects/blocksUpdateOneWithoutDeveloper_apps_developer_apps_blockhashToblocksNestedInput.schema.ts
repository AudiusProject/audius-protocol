import { z } from 'zod';
import { blocksCreateWithoutDeveloper_apps_developer_apps_blockhashToblocksInputObjectSchema } from './blocksCreateWithoutDeveloper_apps_developer_apps_blockhashToblocksInput.schema';
import { blocksUncheckedCreateWithoutDeveloper_apps_developer_apps_blockhashToblocksInputObjectSchema } from './blocksUncheckedCreateWithoutDeveloper_apps_developer_apps_blockhashToblocksInput.schema';
import { blocksCreateOrConnectWithoutDeveloper_apps_developer_apps_blockhashToblocksInputObjectSchema } from './blocksCreateOrConnectWithoutDeveloper_apps_developer_apps_blockhashToblocksInput.schema';
import { blocksUpsertWithoutDeveloper_apps_developer_apps_blockhashToblocksInputObjectSchema } from './blocksUpsertWithoutDeveloper_apps_developer_apps_blockhashToblocksInput.schema';
import { blocksWhereUniqueInputObjectSchema } from './blocksWhereUniqueInput.schema';
import { blocksUpdateWithoutDeveloper_apps_developer_apps_blockhashToblocksInputObjectSchema } from './blocksUpdateWithoutDeveloper_apps_developer_apps_blockhashToblocksInput.schema';
import { blocksUncheckedUpdateWithoutDeveloper_apps_developer_apps_blockhashToblocksInputObjectSchema } from './blocksUncheckedUpdateWithoutDeveloper_apps_developer_apps_blockhashToblocksInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.blocksUpdateOneWithoutDeveloper_apps_developer_apps_blockhashToblocksNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(
            () =>
              blocksCreateWithoutDeveloper_apps_developer_apps_blockhashToblocksInputObjectSchema,
          ),
          z.lazy(
            () =>
              blocksUncheckedCreateWithoutDeveloper_apps_developer_apps_blockhashToblocksInputObjectSchema,
          ),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(
          () =>
            blocksCreateOrConnectWithoutDeveloper_apps_developer_apps_blockhashToblocksInputObjectSchema,
        )
        .optional(),
      upsert: z
        .lazy(
          () =>
            blocksUpsertWithoutDeveloper_apps_developer_apps_blockhashToblocksInputObjectSchema,
        )
        .optional(),
      disconnect: z.boolean().optional(),
      delete: z.boolean().optional(),
      connect: z.lazy(() => blocksWhereUniqueInputObjectSchema).optional(),
      update: z
        .union([
          z.lazy(
            () =>
              blocksUpdateWithoutDeveloper_apps_developer_apps_blockhashToblocksInputObjectSchema,
          ),
          z.lazy(
            () =>
              blocksUncheckedUpdateWithoutDeveloper_apps_developer_apps_blockhashToblocksInputObjectSchema,
          ),
        ])
        .optional(),
    })
    .strict();

export const blocksUpdateOneWithoutDeveloper_apps_developer_apps_blockhashToblocksNestedInputObjectSchema =
  Schema;
