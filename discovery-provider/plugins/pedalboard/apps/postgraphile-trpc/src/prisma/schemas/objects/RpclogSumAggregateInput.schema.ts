import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.RpclogSumAggregateInputType> = z
  .object({
    jetstream_seq: z.literal(true).optional(),
  })
  .strict();

export const RpclogSumAggregateInputObjectSchema = Schema;
