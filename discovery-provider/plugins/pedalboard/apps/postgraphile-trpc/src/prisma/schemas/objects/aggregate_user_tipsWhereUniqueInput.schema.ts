import { z } from 'zod';
import { aggregate_user_tipsSender_user_idReceiver_user_idCompoundUniqueInputObjectSchema } from './aggregate_user_tipsSender_user_idReceiver_user_idCompoundUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_user_tipsWhereUniqueInput> = z
  .object({
    sender_user_id_receiver_user_id: z
      .lazy(
        () =>
          aggregate_user_tipsSender_user_idReceiver_user_idCompoundUniqueInputObjectSchema,
      )
      .optional(),
  })
  .strict();

export const aggregate_user_tipsWhereUniqueInputObjectSchema = Schema;
