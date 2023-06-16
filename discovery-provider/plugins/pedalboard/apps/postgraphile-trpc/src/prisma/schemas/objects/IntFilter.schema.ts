import { z } from 'zod';
import { NestedIntFilterObjectSchema } from './NestedIntFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.IntFilter> = z
  .object({
    equals: z.number().optional(),
    in: z.union([z.number().array(), z.number()]).optional(),
    notIn: z.union([z.number().array(), z.number()]).optional(),
    lt: z.number().optional(),
    lte: z.number().optional(),
    gt: z.number().optional(),
    gte: z.number().optional(),
    not: z
      .union([z.number(), z.lazy(() => NestedIntFilterObjectSchema)])
      .optional(),
  })
  .strict();

export const IntFilterObjectSchema = Schema;
