import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Rpc_logMaxAggregateInputType> = z
  .object({
    relayed_at: z.literal(true).optional(),
    from_wallet: z.literal(true).optional(),
    sig: z.literal(true).optional(),
    relayed_by: z.literal(true).optional(),
    applied_at: z.literal(true).optional(),
  })
  .strict();

export const Rpc_logMaxAggregateInputObjectSchema = Schema;
