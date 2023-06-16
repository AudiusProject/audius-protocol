import { z } from 'zod';
import { chat_message_reactionsCreateWithoutChat_messageInputObjectSchema } from './chat_message_reactionsCreateWithoutChat_messageInput.schema';
import { chat_message_reactionsUncheckedCreateWithoutChat_messageInputObjectSchema } from './chat_message_reactionsUncheckedCreateWithoutChat_messageInput.schema';
import { chat_message_reactionsCreateOrConnectWithoutChat_messageInputObjectSchema } from './chat_message_reactionsCreateOrConnectWithoutChat_messageInput.schema';
import { chat_message_reactionsUpsertWithWhereUniqueWithoutChat_messageInputObjectSchema } from './chat_message_reactionsUpsertWithWhereUniqueWithoutChat_messageInput.schema';
import { chat_message_reactionsCreateManyChat_messageInputEnvelopeObjectSchema } from './chat_message_reactionsCreateManyChat_messageInputEnvelope.schema';
import { chat_message_reactionsWhereUniqueInputObjectSchema } from './chat_message_reactionsWhereUniqueInput.schema';
import { chat_message_reactionsUpdateWithWhereUniqueWithoutChat_messageInputObjectSchema } from './chat_message_reactionsUpdateWithWhereUniqueWithoutChat_messageInput.schema';
import { chat_message_reactionsUpdateManyWithWhereWithoutChat_messageInputObjectSchema } from './chat_message_reactionsUpdateManyWithWhereWithoutChat_messageInput.schema';
import { chat_message_reactionsScalarWhereInputObjectSchema } from './chat_message_reactionsScalarWhereInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_message_reactionsUncheckedUpdateManyWithoutChat_messageNestedInput> =
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
      upsert: z
        .union([
          z.lazy(
            () =>
              chat_message_reactionsUpsertWithWhereUniqueWithoutChat_messageInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                chat_message_reactionsUpsertWithWhereUniqueWithoutChat_messageInputObjectSchema,
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
      set: z
        .union([
          z.lazy(() => chat_message_reactionsWhereUniqueInputObjectSchema),
          z
            .lazy(() => chat_message_reactionsWhereUniqueInputObjectSchema)
            .array(),
        ])
        .optional(),
      disconnect: z
        .union([
          z.lazy(() => chat_message_reactionsWhereUniqueInputObjectSchema),
          z
            .lazy(() => chat_message_reactionsWhereUniqueInputObjectSchema)
            .array(),
        ])
        .optional(),
      delete: z
        .union([
          z.lazy(() => chat_message_reactionsWhereUniqueInputObjectSchema),
          z
            .lazy(() => chat_message_reactionsWhereUniqueInputObjectSchema)
            .array(),
        ])
        .optional(),
      connect: z
        .union([
          z.lazy(() => chat_message_reactionsWhereUniqueInputObjectSchema),
          z
            .lazy(() => chat_message_reactionsWhereUniqueInputObjectSchema)
            .array(),
        ])
        .optional(),
      update: z
        .union([
          z.lazy(
            () =>
              chat_message_reactionsUpdateWithWhereUniqueWithoutChat_messageInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                chat_message_reactionsUpdateWithWhereUniqueWithoutChat_messageInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(
            () =>
              chat_message_reactionsUpdateManyWithWhereWithoutChat_messageInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                chat_message_reactionsUpdateManyWithWhereWithoutChat_messageInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      deleteMany: z
        .union([
          z.lazy(() => chat_message_reactionsScalarWhereInputObjectSchema),
          z
            .lazy(() => chat_message_reactionsScalarWhereInputObjectSchema)
            .array(),
        ])
        .optional(),
    })
    .strict();

export const chat_message_reactionsUncheckedUpdateManyWithoutChat_messageNestedInputObjectSchema =
  Schema;
