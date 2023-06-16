import { z } from 'zod';
import { developer_appsWhereUniqueInputObjectSchema } from './developer_appsWhereUniqueInput.schema';
import { developer_appsUpdateWithoutBlocks_developer_apps_blocknumberToblocksInputObjectSchema } from './developer_appsUpdateWithoutBlocks_developer_apps_blocknumberToblocksInput.schema';
import { developer_appsUncheckedUpdateWithoutBlocks_developer_apps_blocknumberToblocksInputObjectSchema } from './developer_appsUncheckedUpdateWithoutBlocks_developer_apps_blocknumberToblocksInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.developer_appsUpdateWithWhereUniqueWithoutBlocks_developer_apps_blocknumberToblocksInput> =
  z
    .object({
      where: z.lazy(() => developer_appsWhereUniqueInputObjectSchema),
      data: z.union([
        z.lazy(
          () =>
            developer_appsUpdateWithoutBlocks_developer_apps_blocknumberToblocksInputObjectSchema,
        ),
        z.lazy(
          () =>
            developer_appsUncheckedUpdateWithoutBlocks_developer_apps_blocknumberToblocksInputObjectSchema,
        ),
      ]),
    })
    .strict();

export const developer_appsUpdateWithWhereUniqueWithoutBlocks_developer_apps_blocknumberToblocksInputObjectSchema =
  Schema;
