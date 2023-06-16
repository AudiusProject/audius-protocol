import { z } from 'zod';
import { chat_message_reactionsWhereUniqueInputObjectSchema } from './chat_message_reactionsWhereUniqueInput.schema';
import { chat_message_reactionsCreateWithoutChat_messageInputObjectSchema } from './chat_message_reactionsCreateWithoutChat_messageInput.schema';
import { chat_message_reactionsUncheckedCreateWithoutChat_messageInputObjectSchema } from './chat_message_reactionsUncheckedCreateWithoutChat_messageInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_message_reactionsCreateOrConnectWithoutChat_messageInput> =
  z
    .object({
      where: z.lazy(() => chat_message_reactionsWhereUniqueInputObjectSchema),
      create: z.union([
        z.lazy(
          () =>
            chat_message_reactionsCreateWithoutChat_messageInputObjectSchema,
        ),
        z.lazy(
          () =>
            chat_message_reactionsUncheckedCreateWithoutChat_messageInputObjectSchema,
        ),
      ]),
    })
    .strict();

export const chat_message_reactionsCreateOrConnectWithoutChat_messageInputObjectSchema =
  Schema;
