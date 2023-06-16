import { z } from 'zod';
import { chat_memberUpdateWithoutChat_messageInputObjectSchema } from './chat_memberUpdateWithoutChat_messageInput.schema';
import { chat_memberUncheckedUpdateWithoutChat_messageInputObjectSchema } from './chat_memberUncheckedUpdateWithoutChat_messageInput.schema';
import { chat_memberCreateWithoutChat_messageInputObjectSchema } from './chat_memberCreateWithoutChat_messageInput.schema';
import { chat_memberUncheckedCreateWithoutChat_messageInputObjectSchema } from './chat_memberUncheckedCreateWithoutChat_messageInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_memberUpsertWithoutChat_messageInput> = z
  .object({
    update: z.union([
      z.lazy(() => chat_memberUpdateWithoutChat_messageInputObjectSchema),
      z.lazy(
        () => chat_memberUncheckedUpdateWithoutChat_messageInputObjectSchema,
      ),
    ]),
    create: z.union([
      z.lazy(() => chat_memberCreateWithoutChat_messageInputObjectSchema),
      z.lazy(
        () => chat_memberUncheckedCreateWithoutChat_messageInputObjectSchema,
      ),
    ]),
  })
  .strict();

export const chat_memberUpsertWithoutChat_messageInputObjectSchema = Schema;
