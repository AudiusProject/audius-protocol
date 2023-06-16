import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_user_tipsSender_user_idReceiver_user_idCompoundUniqueInput> =
  z
    .object({
      sender_user_id: z.number(),
      receiver_user_id: z.number(),
    })
    .strict();

export const aggregate_user_tipsSender_user_idReceiver_user_idCompoundUniqueInputObjectSchema =
  Schema;
