import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chatWhereUniqueInput> = z
  .object({
    chat_id: z.string().optional(),
  })
  .strict();

export const chatWhereUniqueInputObjectSchema = Schema;
