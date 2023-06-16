import { z } from 'zod';
import { developer_appsWhereUniqueInputObjectSchema } from './developer_appsWhereUniqueInput.schema';
import { developer_appsCreateWithoutBlocks_developer_apps_blockhashToblocksInputObjectSchema } from './developer_appsCreateWithoutBlocks_developer_apps_blockhashToblocksInput.schema';
import { developer_appsUncheckedCreateWithoutBlocks_developer_apps_blockhashToblocksInputObjectSchema } from './developer_appsUncheckedCreateWithoutBlocks_developer_apps_blockhashToblocksInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.developer_appsCreateOrConnectWithoutBlocks_developer_apps_blockhashToblocksInput> =
  z
    .object({
      where: z.lazy(() => developer_appsWhereUniqueInputObjectSchema),
      create: z.union([
        z.lazy(
          () =>
            developer_appsCreateWithoutBlocks_developer_apps_blockhashToblocksInputObjectSchema,
        ),
        z.lazy(
          () =>
            developer_appsUncheckedCreateWithoutBlocks_developer_apps_blockhashToblocksInputObjectSchema,
        ),
      ]),
    })
    .strict();

export const developer_appsCreateOrConnectWithoutBlocks_developer_apps_blockhashToblocksInputObjectSchema =
  Schema;
