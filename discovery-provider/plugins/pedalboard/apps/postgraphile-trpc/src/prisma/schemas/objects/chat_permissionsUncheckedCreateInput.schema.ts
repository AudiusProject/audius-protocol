import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_permissionsUncheckedCreateInput> = z
  .object({
    user_id: z.number(),
    permits: z.string().optional().nullable(),
  })
  .strict();

export const chat_permissionsUncheckedCreateInputObjectSchema = Schema;
