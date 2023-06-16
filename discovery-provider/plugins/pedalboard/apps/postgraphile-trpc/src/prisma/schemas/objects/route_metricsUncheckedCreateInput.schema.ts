import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.route_metricsUncheckedCreateInput> = z
  .object({
    route_path: z.string(),
    version: z.string(),
    query_string: z.string().optional(),
    count: z.number(),
    timestamp: z.coerce.date().optional(),
    created_at: z.coerce.date().optional(),
    updated_at: z.coerce.date().optional(),
    id: z.bigint().optional(),
    ip: z.string().optional().nullable(),
  })
  .strict();

export const route_metricsUncheckedCreateInputObjectSchema = Schema;
