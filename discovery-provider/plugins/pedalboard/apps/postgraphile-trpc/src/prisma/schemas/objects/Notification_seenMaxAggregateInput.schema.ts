import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Notification_seenMaxAggregateInputType> = z
  .object({
    user_id: z.literal(true).optional(),
    seen_at: z.literal(true).optional(),
    blocknumber: z.literal(true).optional(),
    blockhash: z.literal(true).optional(),
    txhash: z.literal(true).optional(),
  })
  .strict();

export const Notification_seenMaxAggregateInputObjectSchema = Schema;
