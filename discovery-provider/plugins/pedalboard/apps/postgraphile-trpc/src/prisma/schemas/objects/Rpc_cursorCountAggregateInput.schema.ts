import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Rpc_cursorCountAggregateInputType> = z
  .object({
    relayed_by: z.literal(true).optional(),
    relayed_at: z.literal(true).optional(),
    _all: z.literal(true).optional(),
  })
  .strict();

export const Rpc_cursorCountAggregateInputObjectSchema = Schema;
