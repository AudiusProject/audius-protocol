import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_monthly_unique_users_metricsWhereUniqueInput> =
  z
    .object({
      id: z.number().optional(),
    })
    .strict();

export const aggregate_monthly_unique_users_metricsWhereUniqueInputObjectSchema =
  Schema;
