import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.IntNullableListFilter> = z
  .object({
    equals: z.number().array().optional().nullable(),
    has: z.number().optional().nullable(),
    hasEvery: z.number().array().optional(),
    hasSome: z.number().array().optional(),
    isEmpty: z.boolean().optional(),
  })
  .strict();

export const IntNullableListFilterObjectSchema = Schema;
