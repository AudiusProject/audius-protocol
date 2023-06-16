import { z } from 'zod';
import { blocksUpdateWithoutDeveloper_apps_developer_apps_blockhashToblocksInputObjectSchema } from './blocksUpdateWithoutDeveloper_apps_developer_apps_blockhashToblocksInput.schema';
import { blocksUncheckedUpdateWithoutDeveloper_apps_developer_apps_blockhashToblocksInputObjectSchema } from './blocksUncheckedUpdateWithoutDeveloper_apps_developer_apps_blockhashToblocksInput.schema';
import { blocksCreateWithoutDeveloper_apps_developer_apps_blockhashToblocksInputObjectSchema } from './blocksCreateWithoutDeveloper_apps_developer_apps_blockhashToblocksInput.schema';
import { blocksUncheckedCreateWithoutDeveloper_apps_developer_apps_blockhashToblocksInputObjectSchema } from './blocksUncheckedCreateWithoutDeveloper_apps_developer_apps_blockhashToblocksInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.blocksUpsertWithoutDeveloper_apps_developer_apps_blockhashToblocksInput> =
  z
    .object({
      update: z.union([
        z.lazy(
          () =>
            blocksUpdateWithoutDeveloper_apps_developer_apps_blockhashToblocksInputObjectSchema,
        ),
        z.lazy(
          () =>
            blocksUncheckedUpdateWithoutDeveloper_apps_developer_apps_blockhashToblocksInputObjectSchema,
        ),
      ]),
      create: z.union([
        z.lazy(
          () =>
            blocksCreateWithoutDeveloper_apps_developer_apps_blockhashToblocksInputObjectSchema,
        ),
        z.lazy(
          () =>
            blocksUncheckedCreateWithoutDeveloper_apps_developer_apps_blockhashToblocksInputObjectSchema,
        ),
      ]),
    })
    .strict();

export const blocksUpsertWithoutDeveloper_apps_developer_apps_blockhashToblocksInputObjectSchema =
  Schema;
