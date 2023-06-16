import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Route_metricsMinAggregateInputType> = z
  .object({
    route_path: z.literal(true).optional(),
    version: z.literal(true).optional(),
    query_string: z.literal(true).optional(),
    count: z.literal(true).optional(),
    timestamp: z.literal(true).optional(),
    created_at: z.literal(true).optional(),
    updated_at: z.literal(true).optional(),
    id: z.literal(true).optional(),
    ip: z.literal(true).optional(),
  })
  .strict();

export const Route_metricsMinAggregateInputObjectSchema = Schema;
