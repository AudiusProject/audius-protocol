import { z } from 'zod';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';
import { DecimalFilterObjectSchema } from './DecimalFilter.schema';
import { StringNullableFilterObjectSchema } from './StringNullableFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.audio_transactions_historyWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => audio_transactions_historyWhereInputObjectSchema),
        z.lazy(() => audio_transactions_historyWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => audio_transactions_historyWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => audio_transactions_historyWhereInputObjectSchema),
        z.lazy(() => audio_transactions_historyWhereInputObjectSchema).array(),
      ])
      .optional(),
    user_bank: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    slot: z.union([z.lazy(() => IntFilterObjectSchema), z.number()]).optional(),
    signature: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    transaction_type: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    method: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    created_at: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
    updated_at: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
    transaction_created_at: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
    change: z
      .union([z.lazy(() => DecimalFilterObjectSchema), z.number()])
      .optional(),
    balance: z
      .union([z.lazy(() => DecimalFilterObjectSchema), z.number()])
      .optional(),
    tx_metadata: z
      .union([z.lazy(() => StringNullableFilterObjectSchema), z.string()])
      .optional()
      .nullable(),
  })
  .strict();

export const audio_transactions_historyWhereInputObjectSchema = Schema;
