import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.grantsCreateManyBlocks_grants_blocknumberToblocksInput> =
  z
    .object({
      blockhash: z.string().optional().nullable(),
      grantee_address: z.string(),
      user_id: z.number(),
      is_revoked: z.boolean().optional(),
      is_current: z.boolean(),
      is_approved: z.boolean().optional(),
      updated_at: z.coerce.date(),
      created_at: z.coerce.date(),
      txhash: z.string(),
    })
    .strict();

export const grantsCreateManyBlocks_grants_blocknumberToblocksInputObjectSchema =
  Schema;
