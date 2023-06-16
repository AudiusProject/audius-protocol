import { z } from 'zod';
import { blocksCreateNestedOneWithoutDeveloper_apps_developer_apps_blockhashToblocksInputObjectSchema } from './blocksCreateNestedOneWithoutDeveloper_apps_developer_apps_blockhashToblocksInput.schema';
import { blocksCreateNestedOneWithoutDeveloper_apps_developer_apps_blocknumberToblocksInputObjectSchema } from './blocksCreateNestedOneWithoutDeveloper_apps_developer_apps_blocknumberToblocksInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.developer_appsCreateInput> = z
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
    blocks_developer_apps_blocknumberToblocks: z
      .lazy(
        () =>
          blocksCreateNestedOneWithoutDeveloper_apps_developer_apps_blocknumberToblocksInputObjectSchema,
      )
      .optional(),
  })
  .strict();

export const developer_appsCreateInputObjectSchema = Schema;
