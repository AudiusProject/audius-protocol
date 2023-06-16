import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_pubkeysWhereUniqueInput> = z
  .object({
    user_id: z.number().optional(),
  })
  .strict();

export const user_pubkeysWhereUniqueInputObjectSchema = Schema;
