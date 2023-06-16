import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.route_metricsWhereUniqueInput> = z
  .object({
    id: z.bigint().optional(),
  })
  .strict();

export const route_metricsWhereUniqueInputObjectSchema = Schema;
