import { z } from 'zod';
import { StringNullableFilterObjectSchema } from './StringNullableFilter.schema';
import { IntNullableFilterObjectSchema } from './IntNullableFilter.schema';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';
import { BoolFilterObjectSchema } from './BoolFilter.schema';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { IntNullableListFilterObjectSchema } from './IntNullableListFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.ursm_content_nodesWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => ursm_content_nodesWhereInputObjectSchema),
        z.lazy(() => ursm_content_nodesWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => ursm_content_nodesWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => ursm_content_nodesWhereInputObjectSchema),
        z.lazy(() => ursm_content_nodesWhereInputObjectSchema).array(),
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
    created_at: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
    is_current: z
      .union([z.lazy(() => BoolFilterObjectSchema), z.boolean()])
      .optional(),
    cnode_sp_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    delegate_owner_wallet: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    owner_wallet: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    proposer_sp_ids: z.lazy(() => IntNullableListFilterObjectSchema).optional(),
    proposer_1_delegate_owner_wallet: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    proposer_2_delegate_owner_wallet: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    proposer_3_delegate_owner_wallet: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    endpoint: z
      .union([z.lazy(() => StringNullableFilterObjectSchema), z.string()])
      .optional()
      .nullable(),
    txhash: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    slot: z
      .union([z.lazy(() => IntNullableFilterObjectSchema), z.number()])
      .optional()
      .nullable(),
  })
  .strict();

export const ursm_content_nodesWhereInputObjectSchema = Schema;
