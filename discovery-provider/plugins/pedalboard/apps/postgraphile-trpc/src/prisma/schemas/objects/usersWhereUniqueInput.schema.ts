import { z } from 'zod';
import { usersIs_currentUser_idTxhashCompoundUniqueInputObjectSchema } from './usersIs_currentUser_idTxhashCompoundUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.usersWhereUniqueInput> = z
  .object({
    is_current_user_id_txhash: z
      .lazy(() => usersIs_currentUser_idTxhashCompoundUniqueInputObjectSchema)
      .optional(),
  })
  .strict();

export const usersWhereUniqueInputObjectSchema = Schema;
