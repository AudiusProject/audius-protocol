import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_playsCreateManyInput> = z
  .object({
    play_item_id: z.number(),
    count: z.bigint().optional().nullable(),
  })
  .strict();

export const aggregate_playsCreateManyInputObjectSchema = Schema;
