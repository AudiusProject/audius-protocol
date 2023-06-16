import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Track_delist_statusesCountAggregateInputType> = z
  .object({
    created_at: z.literal(true).optional(),
    track_id: z.literal(true).optional(),
    owner_id: z.literal(true).optional(),
    track_cid: z.literal(true).optional(),
    delisted: z.literal(true).optional(),
    reason: z.literal(true).optional(),
    _all: z.literal(true).optional(),
  })
  .strict();

export const Track_delist_statusesCountAggregateInputObjectSchema = Schema;
