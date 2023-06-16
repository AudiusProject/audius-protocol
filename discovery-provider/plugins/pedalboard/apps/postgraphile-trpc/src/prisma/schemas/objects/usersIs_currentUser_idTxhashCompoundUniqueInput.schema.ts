import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.usersIs_currentUser_idTxhashCompoundUniqueInput> =
  z
    .object({
      is_current: z.boolean(),
      user_id: z.number(),
      txhash: z.string(),
    })
    .strict();

export const usersIs_currentUser_idTxhashCompoundUniqueInputObjectSchema =
  Schema;
