import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_monthly_total_users_metricsCreateInput> =
  z
    .object({
      count: z.number(),
      timestamp: z.coerce.date(),
      created_at: z.coerce.date().optional(),
      updated_at: z.coerce.date().optional(),
    })
    .strict();

export const aggregate_monthly_total_users_metricsCreateInputObjectSchema =
  Schema;
