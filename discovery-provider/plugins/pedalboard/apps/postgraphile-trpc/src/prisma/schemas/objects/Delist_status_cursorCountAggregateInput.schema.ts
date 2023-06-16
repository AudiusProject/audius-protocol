import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Delist_status_cursorCountAggregateInputType> = z
  .object({
    host: z.literal(true).optional(),
    entity: z.literal(true).optional(),
    created_at: z.literal(true).optional(),
    _all: z.literal(true).optional(),
  })
  .strict();

export const Delist_status_cursorCountAggregateInputObjectSchema = Schema;
