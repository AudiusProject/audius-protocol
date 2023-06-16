import { z } from 'zod';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';
import { EnumskippedtransactionlevelNullableFilterObjectSchema } from './EnumskippedtransactionlevelNullableFilter.schema';
import { skippedtransactionlevelSchema } from '../enums/skippedtransactionlevel.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.skipped_transactionsWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => skipped_transactionsWhereInputObjectSchema),
        z.lazy(() => skipped_transactionsWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => skipped_transactionsWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => skipped_transactionsWhereInputObjectSchema),
        z.lazy(() => skipped_transactionsWhereInputObjectSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterObjectSchema), z.number()]).optional(),
    blocknumber: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    blockhash: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    txhash: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    created_at: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
    updated_at: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
    level: z
      .union([
        z.lazy(() => EnumskippedtransactionlevelNullableFilterObjectSchema),
        z.lazy(() => skippedtransactionlevelSchema),
      ])
      .optional()
      .nullable(),
  })
  .strict();

export const skipped_transactionsWhereInputObjectSchema = Schema;
