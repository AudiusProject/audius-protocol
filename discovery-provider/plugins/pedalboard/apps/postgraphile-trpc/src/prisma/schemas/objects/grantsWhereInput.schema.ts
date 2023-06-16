import { z } from 'zod';
import { StringNullableFilterObjectSchema } from './StringNullableFilter.schema';
import { IntNullableFilterObjectSchema } from './IntNullableFilter.schema';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { BoolFilterObjectSchema } from './BoolFilter.schema';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';
import { BlocksRelationFilterObjectSchema } from './BlocksRelationFilter.schema';
import { blocksWhereInputObjectSchema } from './blocksWhereInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.grantsWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => grantsWhereInputObjectSchema),
        z.lazy(() => grantsWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => grantsWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => grantsWhereInputObjectSchema),
        z.lazy(() => grantsWhereInputObjectSchema).array(),
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
    grantee_address: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    user_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    is_revoked: z
      .union([z.lazy(() => BoolFilterObjectSchema), z.boolean()])
      .optional(),
    is_current: z
      .union([z.lazy(() => BoolFilterObjectSchema), z.boolean()])
      .optional(),
    is_approved: z
      .union([z.lazy(() => BoolFilterObjectSchema), z.boolean()])
      .optional(),
    updated_at: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
    created_at: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
    txhash: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    blocks_grants_blockhashToblocks: z
      .union([
        z.lazy(() => BlocksRelationFilterObjectSchema),
        z.lazy(() => blocksWhereInputObjectSchema),
      ])
      .optional()
      .nullable(),
    blocks_grants_blocknumberToblocks: z
      .union([
        z.lazy(() => BlocksRelationFilterObjectSchema),
        z.lazy(() => blocksWhereInputObjectSchema),
      ])
      .optional()
      .nullable(),
  })
  .strict();

export const grantsWhereInputObjectSchema = Schema;
