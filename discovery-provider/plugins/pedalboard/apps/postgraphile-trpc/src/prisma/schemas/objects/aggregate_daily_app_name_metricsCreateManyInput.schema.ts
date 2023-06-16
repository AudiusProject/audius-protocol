import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_daily_app_name_metricsCreateManyInput> =
  z
    .object({
      id: z.number().optional(),
      application_name: z.string(),
      count: z.number(),
      timestamp: z.coerce.date(),
      created_at: z.coerce.date().optional(),
      updated_at: z.coerce.date().optional(),
    })
    .strict();

export const aggregate_daily_app_name_metricsCreateManyInputObjectSchema =
  Schema;
