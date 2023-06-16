import { z } from 'zod';
import { followsIs_currentFollower_user_idFollowee_user_idTxhashCompoundUniqueInputObjectSchema } from './followsIs_currentFollower_user_idFollowee_user_idTxhashCompoundUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.followsWhereUniqueInput> = z
  .object({
    is_current_follower_user_id_followee_user_id_txhash: z
      .lazy(
        () =>
          followsIs_currentFollower_user_idFollowee_user_idTxhashCompoundUniqueInputObjectSchema,
      )
      .optional(),
  })
  .strict();

export const followsWhereUniqueInputObjectSchema = Schema;
