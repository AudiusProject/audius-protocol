import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_message_reactionsUser_idMessage_idCompoundUniqueInput> =
  z
    .object({
      user_id: z.number(),
      message_id: z.string(),
    })
    .strict();

export const chat_message_reactionsUser_idMessage_idCompoundUniqueInputObjectSchema =
  Schema;
