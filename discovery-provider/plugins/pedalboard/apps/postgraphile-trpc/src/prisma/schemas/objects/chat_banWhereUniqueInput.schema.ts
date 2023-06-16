import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_banWhereUniqueInput> = z
  .object({
    user_id: z.number().optional(),
  })
  .strict();

export const chat_banWhereUniqueInputObjectSchema = Schema;
