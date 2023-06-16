import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.MilestonesSumAggregateInputType> = z
  .object({
    id: z.literal(true).optional(),
    threshold: z.literal(true).optional(),
    blocknumber: z.literal(true).optional(),
    slot: z.literal(true).optional(),
  })
  .strict();

export const MilestonesSumAggregateInputObjectSchema = Schema;
