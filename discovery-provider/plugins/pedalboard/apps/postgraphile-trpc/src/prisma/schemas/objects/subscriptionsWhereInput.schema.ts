import { z } from 'zod';
import { StringNullableFilterObjectSchema } from './StringNullableFilter.schema';
import { IntNullableFilterObjectSchema } from './IntNullableFilter.schema';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { BoolFilterObjectSchema } from './BoolFilter.schema';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';
import { StringFilterObjectSchema } from './StringFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.subscriptionsWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => subscriptionsWhereInputObjectSchema),
        z.lazy(() => subscriptionsWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => subscriptionsWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => subscriptionsWhereInputObjectSchema),
        z.lazy(() => subscriptionsWhereInputObjectSchema).array(),
      ])
      .optional(),
    blockhash: z
      .union([z.lazy(() => StringNullableFilterObjectSchema), z.string()])
      .optional()
      .nullable(),
    blocknumber: z
      .union([z.lazy(() => IntNullableFilterObjectSchema), z.number()])
      .optional()
      .nullable(),
    subscriber_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    user_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    is_current: z
      .union([z.lazy(() => BoolFilterObjectSchema), z.boolean()])
      .optional(),
    is_delete: z
      .union([z.lazy(() => BoolFilterObjectSchema), z.boolean()])
      .optional(),
    created_at: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
    txhash: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
  })
  .strict();

export const subscriptionsWhereInputObjectSchema = Schema;
