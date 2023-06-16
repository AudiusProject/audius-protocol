import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.User_eventsMaxAggregateInputType> = z
  .object({
    id: z.literal(true).optional(),
    blockhash: z.literal(true).optional(),
    blocknumber: z.literal(true).optional(),
    is_current: z.literal(true).optional(),
    user_id: z.literal(true).optional(),
    referrer: z.literal(true).optional(),
    is_mobile_user: z.literal(true).optional(),
    slot: z.literal(true).optional(),
  })
  .strict();

export const User_eventsMaxAggregateInputObjectSchema = Schema;
