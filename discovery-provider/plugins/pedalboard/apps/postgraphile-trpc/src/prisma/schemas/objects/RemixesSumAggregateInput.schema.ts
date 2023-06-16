import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.RemixesSumAggregateInputType> = z
  .object({
    parent_track_id: z.literal(true).optional(),
    child_track_id: z.literal(true).optional(),
  })
  .strict();

export const RemixesSumAggregateInputObjectSchema = Schema;
