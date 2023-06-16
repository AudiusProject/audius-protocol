import { z } from 'zod';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { StringNullableFilterObjectSchema } from './StringNullableFilter.schema';
import { IntNullableFilterObjectSchema } from './IntNullableFilter.schema';
import { BoolFilterObjectSchema } from './BoolFilter.schema';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';
import { BlocksRelationFilterObjectSchema } from './BlocksRelationFilter.schema';
import { blocksWhereInputObjectSchema } from './blocksWhereInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.developer_appsWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => developer_appsWhereInputObjectSchema),
        z.lazy(() => developer_appsWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => developer_appsWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => developer_appsWhereInputObjectSchema),
        z.lazy(() => developer_appsWhereInputObjectSchema).array(),
      ])
      .optional(),
    address: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
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
      .union([z.lazy(() => IntNullableFilterObjectSchema), z.number()])
      .optional()
      .nullable(),
    name: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    is_personal_access: z
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
    is_current: z
      .union([z.lazy(() => BoolFilterObjectSchema), z.boolean()])
      .optional(),
    updated_at: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
    description: z
      .union([z.lazy(() => StringNullableFilterObjectSchema), z.string()])
      .optional()
      .nullable(),
    blocks_developer_apps_blockhashToblocks: z
      .union([
        z.lazy(() => BlocksRelationFilterObjectSchema),
        z.lazy(() => blocksWhereInputObjectSchema),
      ])
      .optional()
      .nullable(),
    blocks_developer_apps_blocknumberToblocks: z
      .union([
        z.lazy(() => BlocksRelationFilterObjectSchema),
        z.lazy(() => blocksWhereInputObjectSchema),
      ])
      .optional()
      .nullable(),
  })
  .strict();

export const developer_appsWhereInputObjectSchema = Schema;
