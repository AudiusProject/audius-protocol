import { z } from 'zod';
import { chat_message_reactionsUser_idMessage_idCompoundUniqueInputObjectSchema } from './chat_message_reactionsUser_idMessage_idCompoundUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_message_reactionsWhereUniqueInput> = z
  .object({
    user_id_message_id: z
      .lazy(
        () =>
          chat_message_reactionsUser_idMessage_idCompoundUniqueInputObjectSchema,
      )
      .optional(),
  })
  .strict();

export const chat_message_reactionsWhereUniqueInputObjectSchema = Schema;
