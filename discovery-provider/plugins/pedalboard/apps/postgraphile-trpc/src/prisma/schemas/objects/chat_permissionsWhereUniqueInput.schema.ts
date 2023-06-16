import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_permissionsWhereUniqueInput> = z
  .object({
    user_id: z.number().optional(),
  })
  .strict();

export const chat_permissionsWhereUniqueInputObjectSchema = Schema;
