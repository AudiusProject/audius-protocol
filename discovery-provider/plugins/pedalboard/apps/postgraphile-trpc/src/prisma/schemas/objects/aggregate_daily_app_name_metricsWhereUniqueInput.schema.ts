import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_daily_app_name_metricsWhereUniqueInput> =
  z
    .object({
      id: z.number().optional(),
    })
    .strict();

export const aggregate_daily_app_name_metricsWhereUniqueInputObjectSchema =
  Schema;
