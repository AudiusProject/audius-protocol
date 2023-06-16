import { z } from 'zod';
import { grantsGrantee_addressUser_idIs_currentTxhashCompoundUniqueInputObjectSchema } from './grantsGrantee_addressUser_idIs_currentTxhashCompoundUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.grantsWhereUniqueInput> = z
  .object({
    grantee_address_user_id_is_current_txhash: z
      .lazy(
        () =>
          grantsGrantee_addressUser_idIs_currentTxhashCompoundUniqueInputObjectSchema,
      )
      .optional(),
  })
  .strict();

export const grantsWhereUniqueInputObjectSchema = Schema;
