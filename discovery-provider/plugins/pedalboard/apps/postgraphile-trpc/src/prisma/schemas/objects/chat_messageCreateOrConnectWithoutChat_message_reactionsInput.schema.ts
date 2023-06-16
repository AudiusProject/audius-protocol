import { z } from 'zod';
import { chat_messageWhereUniqueInputObjectSchema } from './chat_messageWhereUniqueInput.schema';
import { chat_messageCreateWithoutChat_message_reactionsInputObjectSchema } from './chat_messageCreateWithoutChat_message_reactionsInput.schema';
import { chat_messageUncheckedCreateWithoutChat_message_reactionsInputObjectSchema } from './chat_messageUncheckedCreateWithoutChat_message_reactionsInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_messageCreateOrConnectWithoutChat_message_reactionsInput> =
  z
    .object({
      where: z.lazy(() => chat_messageWhereUniqueInputObjectSchema),
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

export const chat_messageCreateOrConnectWithoutChat_message_reactionsInputObjectSchema =
  Schema;
