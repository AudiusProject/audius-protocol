import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.notification_seenUser_idSeen_atCompoundUniqueInput> =
  z
    .object({
      user_id: z.number(),
      seen_at: z.coerce.date(),
    })
    .strict();

export const notification_seenUser_idSeen_atCompoundUniqueInputObjectSchema =
  Schema;
