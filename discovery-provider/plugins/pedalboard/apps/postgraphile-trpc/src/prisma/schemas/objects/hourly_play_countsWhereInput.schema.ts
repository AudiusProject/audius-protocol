import { z } from 'zod';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';
import { IntFilterObjectSchema } from './IntFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.hourly_play_countsWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => hourly_play_countsWhereInputObjectSchema),
        z.lazy(() => hourly_play_countsWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => hourly_play_countsWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => hourly_play_countsWhereInputObjectSchema),
        z.lazy(() => hourly_play_countsWhereInputObjectSchema).array(),
      ])
      .optional(),
    hourly_timestamp: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
    play_count: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
  })
  .strict();

export const hourly_play_countsWhereInputObjectSchema = Schema;
