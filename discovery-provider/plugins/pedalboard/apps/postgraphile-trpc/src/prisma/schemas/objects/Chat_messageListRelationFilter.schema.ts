import { z } from 'zod';
import { chat_messageWhereInputObjectSchema } from './chat_messageWhereInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Chat_messageListRelationFilter> = z
  .object({
    every: z.lazy(() => chat_messageWhereInputObjectSchema).optional(),
    some: z.lazy(() => chat_messageWhereInputObjectSchema).optional(),
    none: z.lazy(() => chat_messageWhereInputObjectSchema).optional(),
  })
  .strict();

export const Chat_messageListRelationFilterObjectSchema = Schema;
