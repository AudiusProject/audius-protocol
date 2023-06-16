import { z } from 'zod';
import { blocksCreateWithoutDeveloper_apps_developer_apps_blockhashToblocksInputObjectSchema } from './blocksCreateWithoutDeveloper_apps_developer_apps_blockhashToblocksInput.schema';
import { blocksUncheckedCreateWithoutDeveloper_apps_developer_apps_blockhashToblocksInputObjectSchema } from './blocksUncheckedCreateWithoutDeveloper_apps_developer_apps_blockhashToblocksInput.schema';
import { blocksCreateOrConnectWithoutDeveloper_apps_developer_apps_blockhashToblocksInputObjectSchema } from './blocksCreateOrConnectWithoutDeveloper_apps_developer_apps_blockhashToblocksInput.schema';
import { blocksWhereUniqueInputObjectSchema } from './blocksWhereUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.blocksCreateNestedOneWithoutDeveloper_apps_developer_apps_blockhashToblocksInput> =
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
      connect: z.lazy(() => blocksWhereUniqueInputObjectSchema).optional(),
    })
    .strict();

export const blocksCreateNestedOneWithoutDeveloper_apps_developer_apps_blockhashToblocksInputObjectSchema =
  Schema;
