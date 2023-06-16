import { z } from 'zod';
import { supporter_rank_upsSlotSender_user_idReceiver_user_idCompoundUniqueInputObjectSchema } from './supporter_rank_upsSlotSender_user_idReceiver_user_idCompoundUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.supporter_rank_upsWhereUniqueInput> = z
  .object({
    slot_sender_user_id_receiver_user_id: z
      .lazy(
        () =>
          supporter_rank_upsSlotSender_user_idReceiver_user_idCompoundUniqueInputObjectSchema,
      )
      .optional(),
  })
  .strict();

export const supporter_rank_upsWhereUniqueInputObjectSchema = Schema;
