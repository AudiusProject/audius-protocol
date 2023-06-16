import { z } from 'zod';
import { blocksWhereInputObjectSchema } from './blocksWhereInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.BlocksRelationFilter> = z
  .object({
    is: z
      .lazy(() => blocksWhereInputObjectSchema)
      .optional()
      .nullable(),
    isNot: z
      .lazy(() => blocksWhereInputObjectSchema)
      .optional()
      .nullable(),
  })
  .strict();

export const BlocksRelationFilterObjectSchema = Schema;
