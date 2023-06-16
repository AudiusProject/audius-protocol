import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_playsWhereUniqueInput> = z
  .object({
    play_item_id: z.number().optional(),
  })
  .strict();

export const aggregate_playsWhereUniqueInputObjectSchema = Schema;
