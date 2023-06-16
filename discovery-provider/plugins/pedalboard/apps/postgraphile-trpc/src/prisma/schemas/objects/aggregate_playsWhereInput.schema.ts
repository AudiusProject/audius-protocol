import { z } from 'zod';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { BigIntNullableFilterObjectSchema } from './BigIntNullableFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_playsWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => aggregate_playsWhereInputObjectSchema),
        z.lazy(() => aggregate_playsWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => aggregate_playsWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => aggregate_playsWhereInputObjectSchema),
        z.lazy(() => aggregate_playsWhereInputObjectSchema).array(),
      ])
      .optional(),
    play_item_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    count: z
      .union([z.lazy(() => BigIntNullableFilterObjectSchema), z.bigint()])
      .optional()
      .nullable(),
  })
  .strict();

export const aggregate_playsWhereInputObjectSchema = Schema;
