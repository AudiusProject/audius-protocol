import { z } from 'zod';
import { developer_appsScalarWhereInputObjectSchema } from './developer_appsScalarWhereInput.schema';
import { developer_appsUpdateManyMutationInputObjectSchema } from './developer_appsUpdateManyMutationInput.schema';
import { developer_appsUncheckedUpdateManyWithoutDeveloper_apps_developer_apps_blockhashToblocksInputObjectSchema } from './developer_appsUncheckedUpdateManyWithoutDeveloper_apps_developer_apps_blockhashToblocksInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.developer_appsUpdateManyWithWhereWithoutBlocks_developer_apps_blockhashToblocksInput> =
  z
    .object({
      where: z.lazy(() => developer_appsScalarWhereInputObjectSchema),
      data: z.union([
        z.lazy(() => developer_appsUpdateManyMutationInputObjectSchema),
        z.lazy(
          () =>
            developer_appsUncheckedUpdateManyWithoutDeveloper_apps_developer_apps_blockhashToblocksInputObjectSchema,
        ),
      ]),
    })
    .strict();

export const developer_appsUpdateManyWithWhereWithoutBlocks_developer_apps_blockhashToblocksInputObjectSchema =
  Schema;
