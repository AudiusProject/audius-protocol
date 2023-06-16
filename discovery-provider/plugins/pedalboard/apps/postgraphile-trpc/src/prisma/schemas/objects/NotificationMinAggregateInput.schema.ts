import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.NotificationMinAggregateInputType> = z
  .object({
    id: z.literal(true).optional(),
    specifier: z.literal(true).optional(),
    group_id: z.literal(true).optional(),
    type: z.literal(true).optional(),
    slot: z.literal(true).optional(),
    blocknumber: z.literal(true).optional(),
    timestamp: z.literal(true).optional(),
    type_v2: z.literal(true).optional(),
  })
  .strict();

export const NotificationMinAggregateInputObjectSchema = Schema;
