import { z } from 'zod';
import { grantsWhereInputObjectSchema } from './grantsWhereInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.GrantsListRelationFilter> = z
  .object({
    every: z.lazy(() => grantsWhereInputObjectSchema).optional(),
    some: z.lazy(() => grantsWhereInputObjectSchema).optional(),
    none: z.lazy(() => grantsWhereInputObjectSchema).optional(),
  })
  .strict();

export const GrantsListRelationFilterObjectSchema = Schema;
