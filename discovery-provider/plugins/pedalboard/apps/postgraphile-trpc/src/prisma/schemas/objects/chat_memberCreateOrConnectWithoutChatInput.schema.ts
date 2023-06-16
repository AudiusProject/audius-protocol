import { z } from 'zod';
import { chat_memberWhereUniqueInputObjectSchema } from './chat_memberWhereUniqueInput.schema';
import { chat_memberCreateWithoutChatInputObjectSchema } from './chat_memberCreateWithoutChatInput.schema';
import { chat_memberUncheckedCreateWithoutChatInputObjectSchema } from './chat_memberUncheckedCreateWithoutChatInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_memberCreateOrConnectWithoutChatInput> = z
  .object({
    where: z.lazy(() => chat_memberWhereUniqueInputObjectSchema),
    create: z.union([
      z.lazy(() => chat_memberCreateWithoutChatInputObjectSchema),
      z.lazy(() => chat_memberUncheckedCreateWithoutChatInputObjectSchema),
    ]),
  })
  .strict();

export const chat_memberCreateOrConnectWithoutChatInputObjectSchema = Schema;
