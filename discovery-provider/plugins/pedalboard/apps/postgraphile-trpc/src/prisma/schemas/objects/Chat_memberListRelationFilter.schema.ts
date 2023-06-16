import { z } from 'zod';
import { chat_memberWhereInputObjectSchema } from './chat_memberWhereInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Chat_memberListRelationFilter> = z
  .object({
    every: z.lazy(() => chat_memberWhereInputObjectSchema).optional(),
    some: z.lazy(() => chat_memberWhereInputObjectSchema).optional(),
    none: z.lazy(() => chat_memberWhereInputObjectSchema).optional(),
  })
  .strict();

export const Chat_memberListRelationFilterObjectSchema = Schema;
