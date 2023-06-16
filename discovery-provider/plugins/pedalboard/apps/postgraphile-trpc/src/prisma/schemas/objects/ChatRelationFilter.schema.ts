import { z } from 'zod';
import { chatWhereInputObjectSchema } from './chatWhereInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.ChatRelationFilter> = z
  .object({
    is: z.lazy(() => chatWhereInputObjectSchema).optional(),
    isNot: z.lazy(() => chatWhereInputObjectSchema).optional(),
  })
  .strict();

export const ChatRelationFilterObjectSchema = Schema;
