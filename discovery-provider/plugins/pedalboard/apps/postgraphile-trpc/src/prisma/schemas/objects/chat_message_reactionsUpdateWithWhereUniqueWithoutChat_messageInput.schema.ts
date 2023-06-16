import { z } from 'zod';
import { chat_message_reactionsWhereUniqueInputObjectSchema } from './chat_message_reactionsWhereUniqueInput.schema';
import { chat_message_reactionsUpdateWithoutChat_messageInputObjectSchema } from './chat_message_reactionsUpdateWithoutChat_messageInput.schema';
import { chat_message_reactionsUncheckedUpdateWithoutChat_messageInputObjectSchema } from './chat_message_reactionsUncheckedUpdateWithoutChat_messageInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_message_reactionsUpdateWithWhereUniqueWithoutChat_messageInput> =
  z
    .object({
      where: z.lazy(() => chat_message_reactionsWhereUniqueInputObjectSchema),
      data: z.union([
        z.lazy(
          () =>
            chat_message_reactionsUpdateWithoutChat_messageInputObjectSchema,
        ),
        z.lazy(
          () =>
            chat_message_reactionsUncheckedUpdateWithoutChat_messageInputObjectSchema,
        ),
      ]),
    })
    .strict();

export const chat_message_reactionsUpdateWithWhereUniqueWithoutChat_messageInputObjectSchema =
  Schema;
