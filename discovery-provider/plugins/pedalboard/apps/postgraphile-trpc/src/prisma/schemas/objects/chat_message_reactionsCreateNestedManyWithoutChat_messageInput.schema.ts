import { z } from 'zod';
import { chat_message_reactionsCreateWithoutChat_messageInputObjectSchema } from './chat_message_reactionsCreateWithoutChat_messageInput.schema';
import { chat_message_reactionsUncheckedCreateWithoutChat_messageInputObjectSchema } from './chat_message_reactionsUncheckedCreateWithoutChat_messageInput.schema';
import { chat_message_reactionsCreateOrConnectWithoutChat_messageInputObjectSchema } from './chat_message_reactionsCreateOrConnectWithoutChat_messageInput.schema';
import { chat_message_reactionsCreateManyChat_messageInputEnvelopeObjectSchema } from './chat_message_reactionsCreateManyChat_messageInputEnvelope.schema';
import { chat_message_reactionsWhereUniqueInputObjectSchema } from './chat_message_reactionsWhereUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_message_reactionsCreateNestedManyWithoutChat_messageInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(
            () =>
              chat_message_reactionsCreateWithoutChat_messageInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                chat_message_reactionsCreateWithoutChat_messageInputObjectSchema,
            )
            .array(),
          z.lazy(
            () =>
              chat_message_reactionsUncheckedCreateWithoutChat_messageInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                chat_message_reactionsUncheckedCreateWithoutChat_messageInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () =>
              chat_message_reactionsCreateOrConnectWithoutChat_messageInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                chat_message_reactionsCreateOrConnectWithoutChat_messageInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(
          () =>
            chat_message_reactionsCreateManyChat_messageInputEnvelopeObjectSchema,
        )
        .optional(),
      connect: z
        .union([
          z.lazy(() => chat_message_reactionsWhereUniqueInputObjectSchema),
          z
            .lazy(() => chat_message_reactionsWhereUniqueInputObjectSchema)
            .array(),
        ])
        .optional(),
    })
    .strict();

export const chat_message_reactionsCreateNestedManyWithoutChat_messageInputObjectSchema =
  Schema;
