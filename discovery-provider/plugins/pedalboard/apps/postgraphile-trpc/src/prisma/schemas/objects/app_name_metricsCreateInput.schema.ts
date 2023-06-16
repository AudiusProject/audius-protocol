import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.app_name_metricsCreateInput> = z
  .object({
    application_name: z.string(),
    count: z.number(),
    timestamp: z.coerce.date().optional(),
    created_at: z.coerce.date().optional(),
    updated_at: z.coerce.date().optional(),
    id: z.bigint().optional(),
    ip: z.string().optional().nullable(),
  })
  .strict();

export const app_name_metricsCreateInputObjectSchema = Schema;
