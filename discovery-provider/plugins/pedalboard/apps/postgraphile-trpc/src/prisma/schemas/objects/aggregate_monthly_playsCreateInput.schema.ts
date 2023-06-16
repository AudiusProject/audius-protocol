import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_monthly_playsCreateInput> = z
  .object({
    play_item_id: z.number(),
    timestamp: z.coerce.date().optional(),
    count: z.number(),
  })
  .strict();

export const aggregate_monthly_playsCreateInputObjectSchema = Schema;
