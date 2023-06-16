import { z } from 'zod';
import { chat_memberWhereUniqueInputObjectSchema } from './chat_memberWhereUniqueInput.schema';
import { chat_memberCreateWithoutChat_messageInputObjectSchema } from './chat_memberCreateWithoutChat_messageInput.schema';
import { chat_memberUncheckedCreateWithoutChat_messageInputObjectSchema } from './chat_memberUncheckedCreateWithoutChat_messageInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_memberCreateOrConnectWithoutChat_messageInput> =
  z
    .object({
      where: z.lazy(() => chat_memberWhereUniqueInputObjectSchema),
      create: z.union([
        z.lazy(() => chat_memberCreateWithoutChat_messageInputObjectSchema),
        z.lazy(
          () => chat_memberUncheckedCreateWithoutChat_messageInputObjectSchema,
        ),
      ]),
    })
    .strict();

export const chat_memberCreateOrConnectWithoutChat_messageInputObjectSchema =
  Schema;
