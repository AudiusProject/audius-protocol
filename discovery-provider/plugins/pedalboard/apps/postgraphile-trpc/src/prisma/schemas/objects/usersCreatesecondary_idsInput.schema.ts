import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.usersCreatesecondary_idsInput> = z
  .object({
    set: z.number().array(),
  })
  .strict();

export const usersCreatesecondary_idsInputObjectSchema = Schema;
