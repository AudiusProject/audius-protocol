import { z } from 'zod';
import { chat_memberCreateWithoutChat_messageInputObjectSchema } from './chat_memberCreateWithoutChat_messageInput.schema';
import { chat_memberUncheckedCreateWithoutChat_messageInputObjectSchema } from './chat_memberUncheckedCreateWithoutChat_messageInput.schema';
import { chat_memberCreateOrConnectWithoutChat_messageInputObjectSchema } from './chat_memberCreateOrConnectWithoutChat_messageInput.schema';
import { chat_memberUpsertWithoutChat_messageInputObjectSchema } from './chat_memberUpsertWithoutChat_messageInput.schema';
import { chat_memberWhereUniqueInputObjectSchema } from './chat_memberWhereUniqueInput.schema';
import { chat_memberUpdateWithoutChat_messageInputObjectSchema } from './chat_memberUpdateWithoutChat_messageInput.schema';
import { chat_memberUncheckedUpdateWithoutChat_messageInputObjectSchema } from './chat_memberUncheckedUpdateWithoutChat_messageInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_memberUpdateOneRequiredWithoutChat_messageNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => chat_memberCreateWithoutChat_messageInputObjectSchema),
          z.lazy(
            () =>
              chat_memberUncheckedCreateWithoutChat_messageInputObjectSchema,
          ),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(
          () => chat_memberCreateOrConnectWithoutChat_messageInputObjectSchema,
        )
        .optional(),
      upsert: z
        .lazy(() => chat_memberUpsertWithoutChat_messageInputObjectSchema)
        .optional(),
      connect: z.lazy(() => chat_memberWhereUniqueInputObjectSchema).optional(),
      update: z
        .union([
          z.lazy(() => chat_memberUpdateWithoutChat_messageInputObjectSchema),
          z.lazy(
            () =>
              chat_memberUncheckedUpdateWithoutChat_messageInputObjectSchema,
          ),
        ])
        .optional(),
    })
    .strict();

export const chat_memberUpdateOneRequiredWithoutChat_messageNestedInputObjectSchema =
  Schema;
