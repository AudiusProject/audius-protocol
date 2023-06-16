import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_banCreateManyInput> = z
  .object({
    user_id: z.number(),
  })
  .strict();

export const chat_banCreateManyInputObjectSchema = Schema;
