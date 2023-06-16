import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_listening_historyWhereUniqueInput> = z
  .object({
    user_id: z.number().optional(),
  })
  .strict();

export const user_listening_historyWhereUniqueInputObjectSchema = Schema;
