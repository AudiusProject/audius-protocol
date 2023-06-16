import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.app_name_metricsWhereUniqueInput> = z
  .object({
    id: z.bigint().optional(),
  })
  .strict();

export const app_name_metricsWhereUniqueInputObjectSchema = Schema;
