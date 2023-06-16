import { z } from 'zod';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_monthly_playsWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => aggregate_monthly_playsWhereInputObjectSchema),
        z.lazy(() => aggregate_monthly_playsWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => aggregate_monthly_playsWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => aggregate_monthly_playsWhereInputObjectSchema),
        z.lazy(() => aggregate_monthly_playsWhereInputObjectSchema).array(),
      ])
      .optional(),
    play_item_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    timestamp: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
    count: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
  })
  .strict();

export const aggregate_monthly_playsWhereInputObjectSchema = Schema;
