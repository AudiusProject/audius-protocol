import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.ReactionsAvgAggregateInputType> = z
  .object({
    id: z.literal(true).optional(),
    slot: z.literal(true).optional(),
    reaction_value: z.literal(true).optional(),
  })
  .strict();

export const ReactionsAvgAggregateInputObjectSchema = Schema;
