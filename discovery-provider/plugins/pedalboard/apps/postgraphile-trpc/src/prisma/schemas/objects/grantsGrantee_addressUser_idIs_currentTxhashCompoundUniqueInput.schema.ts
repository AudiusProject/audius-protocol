import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.grantsGrantee_addressUser_idIs_currentTxhashCompoundUniqueInput> =
  z
    .object({
      grantee_address: z.string(),
      user_id: z.number(),
      is_current: z.boolean(),
      txhash: z.string(),
    })
    .strict();

export const grantsGrantee_addressUser_idIs_currentTxhashCompoundUniqueInputObjectSchema =
  Schema;
