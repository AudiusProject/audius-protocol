import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.reactionsWhereUniqueInput> = z
  .object({
    id: z.number().optional(),
  })
  .strict();

export const reactionsWhereUniqueInputObjectSchema = Schema;
