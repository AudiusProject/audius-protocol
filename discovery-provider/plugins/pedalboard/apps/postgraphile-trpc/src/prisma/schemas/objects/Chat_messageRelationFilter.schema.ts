import { z } from 'zod';
import { chat_messageWhereInputObjectSchema } from './chat_messageWhereInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Chat_messageRelationFilter> = z
  .object({
    is: z.lazy(() => chat_messageWhereInputObjectSchema).optional(),
    isNot: z.lazy(() => chat_messageWhereInputObjectSchema).optional(),
  })
  .strict();

export const Chat_messageRelationFilterObjectSchema = Schema;
