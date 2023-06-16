import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Track_routesAvgAggregateInputType> = z
  .object({
    collision_id: z.literal(true).optional(),
    owner_id: z.literal(true).optional(),
    track_id: z.literal(true).optional(),
    blocknumber: z.literal(true).optional(),
  })
  .strict();

export const Track_routesAvgAggregateInputObjectSchema = Schema;
