import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_trackWhereUniqueInput> = z
  .object({
    track_id: z.number().optional(),
  })
  .strict();

export const aggregate_trackWhereUniqueInputObjectSchema = Schema;
