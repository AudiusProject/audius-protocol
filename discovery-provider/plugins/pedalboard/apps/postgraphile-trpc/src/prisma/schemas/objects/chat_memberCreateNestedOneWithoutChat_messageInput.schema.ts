import { z } from 'zod';
import { chat_memberCreateWithoutChat_messageInputObjectSchema } from './chat_memberCreateWithoutChat_messageInput.schema';
import { chat_memberUncheckedCreateWithoutChat_messageInputObjectSchema } from './chat_memberUncheckedCreateWithoutChat_messageInput.schema';
import { chat_memberCreateOrConnectWithoutChat_messageInputObjectSchema } from './chat_memberCreateOrConnectWithoutChat_messageInput.schema';
import { chat_memberWhereUniqueInputObjectSchema } from './chat_memberWhereUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_memberCreateNestedOneWithoutChat_messageInput> =
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
      connect: z.lazy(() => chat_memberWhereUniqueInputObjectSchema).optional(),
    })
    .strict();

export const chat_memberCreateNestedOneWithoutChat_messageInputObjectSchema =
  Schema;
