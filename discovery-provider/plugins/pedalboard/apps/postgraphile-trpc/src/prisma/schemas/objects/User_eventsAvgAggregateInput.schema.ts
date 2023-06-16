import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.User_eventsAvgAggregateInputType> = z
  .object({
    id: z.literal(true).optional(),
    blocknumber: z.literal(true).optional(),
    user_id: z.literal(true).optional(),
    referrer: z.literal(true).optional(),
    slot: z.literal(true).optional(),
  })
  .strict();

export const User_eventsAvgAggregateInputObjectSchema = Schema;
