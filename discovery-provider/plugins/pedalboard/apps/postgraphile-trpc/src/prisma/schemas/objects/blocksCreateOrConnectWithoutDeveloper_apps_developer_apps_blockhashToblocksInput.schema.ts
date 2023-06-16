import { z } from 'zod';
import { blocksWhereUniqueInputObjectSchema } from './blocksWhereUniqueInput.schema';
import { blocksCreateWithoutDeveloper_apps_developer_apps_blockhashToblocksInputObjectSchema } from './blocksCreateWithoutDeveloper_apps_developer_apps_blockhashToblocksInput.schema';
import { blocksUncheckedCreateWithoutDeveloper_apps_developer_apps_blockhashToblocksInputObjectSchema } from './blocksUncheckedCreateWithoutDeveloper_apps_developer_apps_blockhashToblocksInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.blocksCreateOrConnectWithoutDeveloper_apps_developer_apps_blockhashToblocksInput> =
  z
    .object({
      where: z.lazy(() => blocksWhereUniqueInputObjectSchema),
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

export const blocksCreateOrConnectWithoutDeveloper_apps_developer_apps_blockhashToblocksInputObjectSchema =
  Schema;
