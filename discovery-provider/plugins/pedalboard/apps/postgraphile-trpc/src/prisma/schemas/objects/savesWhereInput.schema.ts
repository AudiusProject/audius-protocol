import { z } from 'zod';
import { StringNullableFilterObjectSchema } from './StringNullableFilter.schema';
import { IntNullableFilterObjectSchema } from './IntNullableFilter.schema';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { EnumsavetypeFilterObjectSchema } from './EnumsavetypeFilter.schema';
import { savetypeSchema } from '../enums/savetype.schema';
import { BoolFilterObjectSchema } from './BoolFilter.schema';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';
import { StringFilterObjectSchema } from './StringFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.savesWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => savesWhereInputObjectSchema),
        z.lazy(() => savesWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => savesWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => savesWhereInputObjectSchema),
        z.lazy(() => savesWhereInputObjectSchema).array(),
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
    save_item_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    save_type: z
      .union([
        z.lazy(() => EnumsavetypeFilterObjectSchema),
        z.lazy(() => savetypeSchema),
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
    is_save_of_repost: z
      .union([z.lazy(() => BoolFilterObjectSchema), z.boolean()])
      .optional(),
  })
  .strict();

export const savesWhereInputObjectSchema = Schema;
