import { z } from 'zod';
import { blocksWhereUniqueInputObjectSchema } from './blocksWhereUniqueInput.schema';
import { blocksCreateWithoutDeveloper_apps_developer_apps_blocknumberToblocksInputObjectSchema } from './blocksCreateWithoutDeveloper_apps_developer_apps_blocknumberToblocksInput.schema';
import { blocksUncheckedCreateWithoutDeveloper_apps_developer_apps_blocknumberToblocksInputObjectSchema } from './blocksUncheckedCreateWithoutDeveloper_apps_developer_apps_blocknumberToblocksInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.blocksCreateOrConnectWithoutDeveloper_apps_developer_apps_blocknumberToblocksInput> =
  z
    .object({
      where: z.lazy(() => blocksWhereUniqueInputObjectSchema),
      create: z.union([
        z.lazy(
          () =>
            blocksCreateWithoutDeveloper_apps_developer_apps_blocknumberToblocksInputObjectSchema,
        ),
        z.lazy(
          () =>
            blocksUncheckedCreateWithoutDeveloper_apps_developer_apps_blocknumberToblocksInputObjectSchema,
        ),
      ]),
    })
    .strict();

export const blocksCreateOrConnectWithoutDeveloper_apps_developer_apps_blocknumberToblocksInputObjectSchema =
  Schema;
