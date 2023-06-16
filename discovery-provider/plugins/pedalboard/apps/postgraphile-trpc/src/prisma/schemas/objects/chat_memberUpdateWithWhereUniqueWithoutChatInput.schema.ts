import { z } from 'zod';
import { chat_memberWhereUniqueInputObjectSchema } from './chat_memberWhereUniqueInput.schema';
import { chat_memberUpdateWithoutChatInputObjectSchema } from './chat_memberUpdateWithoutChatInput.schema';
import { chat_memberUncheckedUpdateWithoutChatInputObjectSchema } from './chat_memberUncheckedUpdateWithoutChatInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_memberUpdateWithWhereUniqueWithoutChatInput> =
  z
    .object({
      where: z.lazy(() => chat_memberWhereUniqueInputObjectSchema),
      data: z.union([
        z.lazy(() => chat_memberUpdateWithoutChatInputObjectSchema),
        z.lazy(() => chat_memberUncheckedUpdateWithoutChatInputObjectSchema),
      ]),
    })
    .strict();

export const chat_memberUpdateWithWhereUniqueWithoutChatInputObjectSchema =
  Schema;
