import { z } from 'zod';
import { StringNullableFilterObjectSchema } from './StringNullableFilter.schema';
import { IntNullableFilterObjectSchema } from './IntNullableFilter.schema';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { EnumreposttypeFilterObjectSchema } from './EnumreposttypeFilter.schema';
import { reposttypeSchema } from '../enums/reposttype.schema';
import { BoolFilterObjectSchema } from './BoolFilter.schema';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';
import { StringFilterObjectSchema } from './StringFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.repostsWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => repostsWhereInputObjectSchema),
        z.lazy(() => repostsWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => repostsWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => repostsWhereInputObjectSchema),
        z.lazy(() => repostsWhereInputObjectSchema).array(),
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
    user_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    repost_item_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    repost_type: z
      .union([
        z.lazy(() => EnumreposttypeFilterObjectSchema),
        z.lazy(() => reposttypeSchema),
      ])
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
    slot: z
      .union([z.lazy(() => IntNullableFilterObjectSchema), z.number()])
      .optional()
      .nullable(),
    is_repost_of_repost: z
      .union([z.lazy(() => BoolFilterObjectSchema), z.boolean()])
      .optional(),
  })
  .strict();

export const repostsWhereInputObjectSchema = Schema;
