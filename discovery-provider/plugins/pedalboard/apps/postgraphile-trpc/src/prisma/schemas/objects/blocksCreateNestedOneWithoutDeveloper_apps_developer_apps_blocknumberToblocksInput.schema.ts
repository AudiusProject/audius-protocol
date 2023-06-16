import { z } from 'zod';
import { blocksCreateWithoutDeveloper_apps_developer_apps_blocknumberToblocksInputObjectSchema } from './blocksCreateWithoutDeveloper_apps_developer_apps_blocknumberToblocksInput.schema';
import { blocksUncheckedCreateWithoutDeveloper_apps_developer_apps_blocknumberToblocksInputObjectSchema } from './blocksUncheckedCreateWithoutDeveloper_apps_developer_apps_blocknumberToblocksInput.schema';
import { blocksCreateOrConnectWithoutDeveloper_apps_developer_apps_blocknumberToblocksInputObjectSchema } from './blocksCreateOrConnectWithoutDeveloper_apps_developer_apps_blocknumberToblocksInput.schema';
import { blocksWhereUniqueInputObjectSchema } from './blocksWhereUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.blocksCreateNestedOneWithoutDeveloper_apps_developer_apps_blocknumberToblocksInput> =
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
      connect: z.lazy(() => blocksWhereUniqueInputObjectSchema).optional(),
    })
    .strict();

export const blocksCreateNestedOneWithoutDeveloper_apps_developer_apps_blocknumberToblocksInputObjectSchema =
  Schema;
