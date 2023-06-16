import { z } from 'zod';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { IntNullableFilterObjectSchema } from './IntNullableFilter.schema';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';
import { JsonNullableFilterObjectSchema } from './JsonNullableFilter.schema';
import { IntNullableListFilterObjectSchema } from './IntNullableListFilter.schema';
import { StringNullableFilterObjectSchema } from './StringNullableFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.notificationWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => notificationWhereInputObjectSchema),
        z.lazy(() => notificationWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => notificationWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => notificationWhereInputObjectSchema),
        z.lazy(() => notificationWhereInputObjectSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterObjectSchema), z.number()]).optional(),
    specifier: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    group_id: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    type: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    slot: z
      .union([z.lazy(() => IntNullableFilterObjectSchema), z.number()])
      .optional()
      .nullable(),
    blocknumber: z
      .union([z.lazy(() => IntNullableFilterObjectSchema), z.number()])
      .optional()
      .nullable(),
    timestamp: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
    data: z.lazy(() => JsonNullableFilterObjectSchema).optional(),
    user_ids: z.lazy(() => IntNullableListFilterObjectSchema).optional(),
    type_v2: z
      .union([z.lazy(() => StringNullableFilterObjectSchema), z.string()])
      .optional()
      .nullable(),
  })
  .strict();

export const notificationWhereInputObjectSchema = Schema;
