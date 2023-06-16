import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.pubkeysWhereUniqueInput> = z
  .object({
    wallet: z.string().optional(),
  })
  .strict();

export const pubkeysWhereUniqueInputObjectSchema = Schema;
