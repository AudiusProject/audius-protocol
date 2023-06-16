import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.ReactionsCountAggregateInputType> = z
  .object({
    id: z.literal(true).optional(),
    slot: z.literal(true).optional(),
    reaction_value: z.literal(true).optional(),
    sender_wallet: z.literal(true).optional(),
    reaction_type: z.literal(true).optional(),
    reacted_to: z.literal(true).optional(),
    timestamp: z.literal(true).optional(),
    tx_signature: z.literal(true).optional(),
    _all: z.literal(true).optional(),
  })
  .strict();

export const ReactionsCountAggregateInputObjectSchema = Schema;
