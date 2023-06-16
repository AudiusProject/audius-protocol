import { z } from 'zod';
import { notification_seenUser_idSeen_atCompoundUniqueInputObjectSchema } from './notification_seenUser_idSeen_atCompoundUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.notification_seenWhereUniqueInput> = z
  .object({
    user_id_seen_at: z
      .lazy(
        () => notification_seenUser_idSeen_atCompoundUniqueInputObjectSchema,
      )
      .optional(),
  })
  .strict();

export const notification_seenWhereUniqueInputObjectSchema = Schema;
