import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.followsIs_currentFollower_user_idFollowee_user_idTxhashCompoundUniqueInput> =
  z
    .object({
      is_current: z.boolean(),
      follower_user_id: z.number(),
      followee_user_id: z.number(),
      txhash: z.string(),
    })
    .strict();

export const followsIs_currentFollower_user_idFollowee_user_idTxhashCompoundUniqueInputObjectSchema =
  Schema;
