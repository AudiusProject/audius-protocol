import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_blocked_usersBlocker_user_idBlockee_user_idCompoundUniqueInput> =
  z
    .object({
      blocker_user_id: z.number(),
      blockee_user_id: z.number(),
    })
    .strict();

export const chat_blocked_usersBlocker_user_idBlockee_user_idCompoundUniqueInputObjectSchema =
  Schema;
