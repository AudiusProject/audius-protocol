import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.subscriptionsSubscriber_idUser_idIs_currentTxhashCompoundUniqueInput> =
  z
    .object({
      subscriber_id: z.number(),
      user_id: z.number(),
      is_current: z.boolean(),
      txhash: z.string(),
    })
    .strict();

export const subscriptionsSubscriber_idUser_idIs_currentTxhashCompoundUniqueInputObjectSchema =
  Schema;
