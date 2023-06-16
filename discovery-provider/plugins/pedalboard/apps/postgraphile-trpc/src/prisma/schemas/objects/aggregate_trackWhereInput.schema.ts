import { z } from 'zod';
import { IntFilterObjectSchema } from './IntFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_trackWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => aggregate_trackWhereInputObjectSchema),
        z.lazy(() => aggregate_trackWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => aggregate_trackWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => aggregate_trackWhereInputObjectSchema),
        z.lazy(() => aggregate_trackWhereInputObjectSchema).array(),
      ])
      .optional(),
    track_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    repost_count: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    save_count: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
  })
  .strict();

export const aggregate_trackWhereInputObjectSchema = Schema;
