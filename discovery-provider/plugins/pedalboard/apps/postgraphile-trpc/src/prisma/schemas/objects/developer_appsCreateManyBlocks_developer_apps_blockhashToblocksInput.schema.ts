import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.developer_appsCreateManyBlocks_developer_apps_blockhashToblocksInput> =
  z
    .object({
      address: z.string(),
      blocknumber: z.number().optional().nullable(),
      user_id: z.number().optional().nullable(),
      name: z.string(),
      is_personal_access: z.boolean().optional(),
      is_delete: z.boolean().optional(),
      created_at: z.coerce.date(),
      txhash: z.string(),
      is_current: z.boolean(),
      updated_at: z.coerce.date(),
      description: z.string().optional().nullable(),
    })
    .strict();

export const developer_appsCreateManyBlocks_developer_apps_blockhashToblocksInputObjectSchema =
  Schema;
