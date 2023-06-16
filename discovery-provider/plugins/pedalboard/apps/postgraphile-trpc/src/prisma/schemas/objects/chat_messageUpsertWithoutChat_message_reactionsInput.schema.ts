import { z } from 'zod';
import { chat_messageUpdateWithoutChat_message_reactionsInputObjectSchema } from './chat_messageUpdateWithoutChat_message_reactionsInput.schema';
import { chat_messageUncheckedUpdateWithoutChat_message_reactionsInputObjectSchema } from './chat_messageUncheckedUpdateWithoutChat_message_reactionsInput.schema';
import { chat_messageCreateWithoutChat_message_reactionsInputObjectSchema } from './chat_messageCreateWithoutChat_message_reactionsInput.schema';
import { chat_messageUncheckedCreateWithoutChat_message_reactionsInputObjectSchema } from './chat_messageUncheckedCreateWithoutChat_message_reactionsInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_messageUpsertWithoutChat_message_reactionsInput> =
  z
    .object({
      update: z.union([
        z.lazy(
          () =>
            chat_messageUpdateWithoutChat_message_reactionsInputObjectSchema,
        ),
        z.lazy(
          () =>
            chat_messageUncheckedUpdateWithoutChat_message_reactionsInputObjectSchema,
        ),
      ]),
      create: z.union([
        z.lazy(
          () =>
            chat_messageCreateWithoutChat_message_reactionsInputObjectSchema,
        ),
        z.lazy(
          () =>
            chat_messageUncheckedCreateWithoutChat_message_reactionsInputObjectSchema,
        ),
      ]),
    })
    .strict();

export const chat_messageUpsertWithoutChat_message_reactionsInputObjectSchema =
  Schema;
