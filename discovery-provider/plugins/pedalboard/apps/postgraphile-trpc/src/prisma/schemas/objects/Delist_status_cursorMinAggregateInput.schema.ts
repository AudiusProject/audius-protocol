import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Delist_status_cursorMinAggregateInputType> = z
  .object({
    host: z.literal(true).optional(),
    entity: z.literal(true).optional(),
    created_at: z.literal(true).optional(),
  })
  .strict();

export const Delist_status_cursorMinAggregateInputObjectSchema = Schema;
