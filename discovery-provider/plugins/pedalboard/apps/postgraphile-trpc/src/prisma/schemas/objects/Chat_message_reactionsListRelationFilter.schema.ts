import { z } from 'zod';
import { chat_message_reactionsWhereInputObjectSchema } from './chat_message_reactionsWhereInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Chat_message_reactionsListRelationFilter> = z
  .object({
    every: z
      .lazy(() => chat_message_reactionsWhereInputObjectSchema)
      .optional(),
    some: z.lazy(() => chat_message_reactionsWhereInputObjectSchema).optional(),
    none: z.lazy(() => chat_message_reactionsWhereInputObjectSchema).optional(),
  })
  .strict();

export const Chat_message_reactionsListRelationFilterObjectSchema = Schema;
