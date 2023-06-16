import { z } from 'zod';
import { reposttypeSchema } from '../enums/reposttype.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.repostsIs_currentUser_idRepost_item_idRepost_typeTxhashCompoundUniqueInput> =
  z
    .object({
      is_current: z.boolean(),
      user_id: z.number(),
      repost_item_id: z.number(),
      repost_type: z.lazy(() => reposttypeSchema),
      txhash: z.string(),
    })
    .strict();

export const repostsIs_currentUser_idRepost_item_idRepost_typeTxhashCompoundUniqueInputObjectSchema =
  Schema;
