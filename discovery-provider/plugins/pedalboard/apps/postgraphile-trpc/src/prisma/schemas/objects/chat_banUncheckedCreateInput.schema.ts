import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_banUncheckedCreateInput> = z
  .object({
    user_id: z.number(),
  })
  .strict();

export const chat_banUncheckedCreateInputObjectSchema = Schema;
