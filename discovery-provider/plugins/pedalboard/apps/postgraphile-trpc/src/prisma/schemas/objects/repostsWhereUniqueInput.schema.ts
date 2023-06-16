import { z } from 'zod';
import { repostsIs_currentUser_idRepost_item_idRepost_typeTxhashCompoundUniqueInputObjectSchema } from './repostsIs_currentUser_idRepost_item_idRepost_typeTxhashCompoundUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.repostsWhereUniqueInput> = z
  .object({
    is_current_user_id_repost_item_id_repost_type_txhash: z
      .lazy(
        () =>
          repostsIs_currentUser_idRepost_item_idRepost_typeTxhashCompoundUniqueInputObjectSchema,
      )
      .optional(),
  })
  .strict();

export const repostsWhereUniqueInputObjectSchema = Schema;
