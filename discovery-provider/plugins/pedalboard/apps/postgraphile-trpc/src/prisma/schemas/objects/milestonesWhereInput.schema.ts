import { z } from 'zod';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { IntNullableFilterObjectSchema } from './IntNullableFilter.schema';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.milestonesWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => milestonesWhereInputObjectSchema),
        z.lazy(() => milestonesWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => milestonesWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => milestonesWhereInputObjectSchema),
        z.lazy(() => milestonesWhereInputObjectSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterObjectSchema), z.number()]).optional(),
    name: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    threshold: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    blocknumber: z
      .union([z.lazy(() => IntNullableFilterObjectSchema), z.number()])
      .optional()
      .nullable(),
    slot: z
      .union([z.lazy(() => IntNullableFilterObjectSchema), z.number()])
      .optional()
      .nullable(),
    timestamp: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
  })
  .strict();

export const milestonesWhereInputObjectSchema = Schema;
