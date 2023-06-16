import { z } from 'zod';
import { chat_memberWhereInputObjectSchema } from './chat_memberWhereInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Chat_memberRelationFilter> = z
  .object({
    is: z.lazy(() => chat_memberWhereInputObjectSchema).optional(),
    isNot: z.lazy(() => chat_memberWhereInputObjectSchema).optional(),
  })
  .strict();

export const Chat_memberRelationFilterObjectSchema = Schema;
