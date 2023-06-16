import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.RpclogAvgAggregateInputType> = z
  .object({
    jetstream_seq: z.literal(true).optional(),
  })
  .strict();

export const RpclogAvgAggregateInputObjectSchema = Schema;
