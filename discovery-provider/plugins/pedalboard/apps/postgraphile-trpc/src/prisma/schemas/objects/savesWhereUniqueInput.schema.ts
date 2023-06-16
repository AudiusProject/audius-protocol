import { z } from 'zod';
import { savesIs_currentUser_idSave_item_idSave_typeTxhashCompoundUniqueInputObjectSchema } from './savesIs_currentUser_idSave_item_idSave_typeTxhashCompoundUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.savesWhereUniqueInput> = z
  .object({
    is_current_user_id_save_item_id_save_type_txhash: z
      .lazy(
        () =>
          savesIs_currentUser_idSave_item_idSave_typeTxhashCompoundUniqueInputObjectSchema,
      )
      .optional(),
  })
  .strict();

export const savesWhereUniqueInputObjectSchema = Schema;
