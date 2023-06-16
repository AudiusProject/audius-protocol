import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_trackUncheckedCreateInput> = z
  .object({
    track_id: z.number(),
    repost_count: z.number().optional(),
    save_count: z.number().optional(),
  })
  .strict();

export const aggregate_trackUncheckedCreateInputObjectSchema = Schema;
