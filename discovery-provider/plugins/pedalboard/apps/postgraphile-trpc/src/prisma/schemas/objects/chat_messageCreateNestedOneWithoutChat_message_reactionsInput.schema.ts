import { z } from 'zod';
import { chat_messageCreateWithoutChat_message_reactionsInputObjectSchema } from './chat_messageCreateWithoutChat_message_reactionsInput.schema';
import { chat_messageUncheckedCreateWithoutChat_message_reactionsInputObjectSchema } from './chat_messageUncheckedCreateWithoutChat_message_reactionsInput.schema';
import { chat_messageCreateOrConnectWithoutChat_message_reactionsInputObjectSchema } from './chat_messageCreateOrConnectWithoutChat_message_reactionsInput.schema';
import { chat_messageWhereUniqueInputObjectSchema } from './chat_messageWhereUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_messageCreateNestedOneWithoutChat_message_reactionsInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(
            () =>
              chat_messageCreateWithoutChat_message_reactionsInputObjectSchema,
          ),
          z.lazy(
            () =>
              chat_messageUncheckedCreateWithoutChat_message_reactionsInputObjectSchema,
          ),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(
          () =>
            chat_messageCreateOrConnectWithoutChat_message_reactionsInputObjectSchema,
        )
        .optional(),
      connect: z
        .lazy(() => chat_messageWhereUniqueInputObjectSchema)
        .optional(),
    })
    .strict();

export const chat_messageCreateNestedOneWithoutChat_message_reactionsInputObjectSchema =
  Schema;
