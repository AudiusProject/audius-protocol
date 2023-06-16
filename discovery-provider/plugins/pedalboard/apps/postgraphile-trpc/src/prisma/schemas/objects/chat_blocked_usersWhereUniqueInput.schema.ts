import { z } from 'zod';
import { chat_blocked_usersBlocker_user_idBlockee_user_idCompoundUniqueInputObjectSchema } from './chat_blocked_usersBlocker_user_idBlockee_user_idCompoundUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_blocked_usersWhereUniqueInput> = z
  .object({
    blocker_user_id_blockee_user_id: z
      .lazy(
        () =>
          chat_blocked_usersBlocker_user_idBlockee_user_idCompoundUniqueInputObjectSchema,
      )
      .optional(),
  })
  .strict();

export const chat_blocked_usersWhereUniqueInputObjectSchema = Schema;
