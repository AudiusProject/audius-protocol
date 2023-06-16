import { z } from 'zod';
import { developer_appsWhereInputObjectSchema } from './developer_appsWhereInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Developer_appsListRelationFilter> = z
  .object({
    every: z.lazy(() => developer_appsWhereInputObjectSchema).optional(),
    some: z.lazy(() => developer_appsWhereInputObjectSchema).optional(),
    none: z.lazy(() => developer_appsWhereInputObjectSchema).optional(),
  })
  .strict();

export const Developer_appsListRelationFilterObjectSchema = Schema;
