import { z } from 'zod';
import { blocksCreateNestedOneWithoutDeveloper_apps_developer_apps_blockhashToblocksInputObjectSchema } from './blocksCreateNestedOneWithoutDeveloper_apps_developer_apps_blockhashToblocksInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.developer_appsCreateWithoutBlocks_developer_apps_blocknumberToblocksInput> =
  z
    .object({
      address: z.string(),
      user_id: z.number().optional().nullable(),
      name: z.string(),
      is_personal_access: z.boolean().optional(),
      is_delete: z.boolean().optional(),
      created_at: z.coerce.date(),
      txhash: z.string(),
      is_current: z.boolean(),
      updated_at: z.coerce.date(),
      description: z.string().optional().nullable(),
      blocks_developer_apps_blockhashToblocks: z
        .lazy(
          () =>
            blocksCreateNestedOneWithoutDeveloper_apps_developer_apps_blockhashToblocksInputObjectSchema,
        )
        .optional(),
    })
    .strict();

export const developer_appsCreateWithoutBlocks_developer_apps_blocknumberToblocksInputObjectSchema =
  Schema;
