import { z } from 'zod';
import { blocksCreateNestedOneWithoutGrants_grants_blockhashToblocksInputObjectSchema } from './blocksCreateNestedOneWithoutGrants_grants_blockhashToblocksInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.grantsCreateWithoutBlocks_grants_blocknumberToblocksInput> =
  z
    .object({
      grantee_address: z.string(),
      user_id: z.number(),
      is_revoked: z.boolean().optional(),
      is_current: z.boolean(),
      is_approved: z.boolean().optional(),
      updated_at: z.coerce.date(),
      created_at: z.coerce.date(),
      txhash: z.string(),
      blocks_grants_blockhashToblocks: z
        .lazy(
          () =>
            blocksCreateNestedOneWithoutGrants_grants_blockhashToblocksInputObjectSchema,
        )
        .optional(),
    })
    .strict();

export const grantsCreateWithoutBlocks_grants_blocknumberToblocksInputObjectSchema =
  Schema;
