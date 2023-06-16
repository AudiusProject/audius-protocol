import { z } from 'zod';
import { user_challengesWhereInputObjectSchema } from './user_challengesWhereInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.User_challengesListRelationFilter> = z
  .object({
    every: z.lazy(() => user_challengesWhereInputObjectSchema).optional(),
    some: z.lazy(() => user_challengesWhereInputObjectSchema).optional(),
    none: z.lazy(() => user_challengesWhereInputObjectSchema).optional(),
  })
  .strict();

export const User_challengesListRelationFilterObjectSchema = Schema;
