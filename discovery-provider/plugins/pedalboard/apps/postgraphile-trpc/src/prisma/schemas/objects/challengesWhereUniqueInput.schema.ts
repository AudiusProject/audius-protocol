import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.challengesWhereUniqueInput> = z
  .object({
    id: z.string().optional(),
  })
  .strict();

export const challengesWhereUniqueInputObjectSchema = Schema;
