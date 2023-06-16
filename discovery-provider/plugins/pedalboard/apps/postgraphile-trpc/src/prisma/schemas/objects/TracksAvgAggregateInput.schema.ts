import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.TracksAvgAggregateInputType> = z
  .object({
    track_id: z.literal(true).optional(),
    owner_id: z.literal(true).optional(),
    length: z.literal(true).optional(),
    blocknumber: z.literal(true).optional(),
    slot: z.literal(true).optional(),
    duration: z.literal(true).optional(),
    ai_attribution_user_id: z.literal(true).optional(),
  })
  .strict();

export const TracksAvgAggregateInputObjectSchema = Schema;
