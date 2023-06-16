import { z } from 'zod';
import { challengesWhereInputObjectSchema } from './challengesWhereInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.ChallengesRelationFilter> = z
  .object({
    is: z.lazy(() => challengesWhereInputObjectSchema).optional(),
    isNot: z.lazy(() => challengesWhereInputObjectSchema).optional(),
  })
  .strict();

export const ChallengesRelationFilterObjectSchema = Schema;
