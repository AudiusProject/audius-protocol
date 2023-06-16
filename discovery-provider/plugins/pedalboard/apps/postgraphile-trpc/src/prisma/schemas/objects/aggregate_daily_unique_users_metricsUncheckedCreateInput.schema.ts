import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_daily_unique_users_metricsUncheckedCreateInput> =
  z
    .object({
      id: z.number().optional(),
      count: z.number(),
      timestamp: z.coerce.date(),
      created_at: z.coerce.date().optional(),
      updated_at: z.coerce.date().optional(),
      summed_count: z.number().optional().nullable(),
    })
    .strict();

export const aggregate_daily_unique_users_metricsUncheckedCreateInputObjectSchema =
  Schema;
