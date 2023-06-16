import { z } from 'zod';
import { blocksUpdateWithoutDeveloper_apps_developer_apps_blocknumberToblocksInputObjectSchema } from './blocksUpdateWithoutDeveloper_apps_developer_apps_blocknumberToblocksInput.schema';
import { blocksUncheckedUpdateWithoutDeveloper_apps_developer_apps_blocknumberToblocksInputObjectSchema } from './blocksUncheckedUpdateWithoutDeveloper_apps_developer_apps_blocknumberToblocksInput.schema';
import { blocksCreateWithoutDeveloper_apps_developer_apps_blocknumberToblocksInputObjectSchema } from './blocksCreateWithoutDeveloper_apps_developer_apps_blocknumberToblocksInput.schema';
import { blocksUncheckedCreateWithoutDeveloper_apps_developer_apps_blocknumberToblocksInputObjectSchema } from './blocksUncheckedCreateWithoutDeveloper_apps_developer_apps_blocknumberToblocksInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.blocksUpsertWithoutDeveloper_apps_developer_apps_blocknumberToblocksInput> =
  z
    .object({
      update: z.union([
        z.lazy(
          () =>
            blocksUpdateWithoutDeveloper_apps_developer_apps_blocknumberToblocksInputObjectSchema,
        ),
        z.lazy(
          () =>
            blocksUncheckedUpdateWithoutDeveloper_apps_developer_apps_blocknumberToblocksInputObjectSchema,
        ),
      ]),
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

export const blocksUpsertWithoutDeveloper_apps_developer_apps_blocknumberToblocksInputObjectSchema =
  Schema;
