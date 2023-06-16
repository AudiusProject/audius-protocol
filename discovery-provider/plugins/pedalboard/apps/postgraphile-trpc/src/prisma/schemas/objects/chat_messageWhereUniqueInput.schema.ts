import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_messageWhereUniqueInput> = z
  .object({
    message_id: z.string().optional(),
  })
  .strict();

export const chat_messageWhereUniqueInputObjectSchema = Schema;
