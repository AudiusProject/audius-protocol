import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_userWhereUniqueInput> = z
  .object({
    user_id: z.number().optional(),
  })
  .strict();

export const aggregate_userWhereUniqueInputObjectSchema = Schema;
