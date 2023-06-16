import { z } from 'zod';
import { subscriptionsSubscriber_idUser_idIs_currentTxhashCompoundUniqueInputObjectSchema } from './subscriptionsSubscriber_idUser_idIs_currentTxhashCompoundUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.subscriptionsWhereUniqueInput> = z
  .object({
    subscriber_id_user_id_is_current_txhash: z
      .lazy(
        () =>
          subscriptionsSubscriber_idUser_idIs_currentTxhashCompoundUniqueInputObjectSchema,
      )
      .optional(),
  })
  .strict();

export const subscriptionsWhereUniqueInputObjectSchema = Schema;
