import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.hourly_play_countsWhereUniqueInput> = z
  .object({
    hourly_timestamp: z.coerce.date().optional(),
  })
  .strict();

export const hourly_play_countsWhereUniqueInputObjectSchema = Schema;
