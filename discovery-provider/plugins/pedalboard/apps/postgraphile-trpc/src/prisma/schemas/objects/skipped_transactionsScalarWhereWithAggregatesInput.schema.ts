import { z } from 'zod';
import { IntWithAggregatesFilterObjectSchema } from './IntWithAggregatesFilter.schema';
import { StringWithAggregatesFilterObjectSchema } from './StringWithAggregatesFilter.schema';
import { DateTimeWithAggregatesFilterObjectSchema } from './DateTimeWithAggregatesFilter.schema';
import { EnumskippedtransactionlevelNullableWithAggregatesFilterObjectSchema } from './EnumskippedtransactionlevelNullableWithAggregatesFilter.schema';
import { skippedtransactionlevelSchema } from '../enums/skippedtransactionlevel.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.skipped_transactionsScalarWhereWithAggregatesInput> =
  z
    .object({
      AND: z
        .union([
          z.lazy(
            () =>
              skipped_transactionsScalarWhereWithAggregatesInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                skipped_transactionsScalarWhereWithAggregatesInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      OR: z
        .lazy(
          () => skipped_transactionsScalarWhereWithAggregatesInputObjectSchema,
        )
        .array()
        .optional(),
      NOT: z
        .union([
          z.lazy(
            () =>
              skipped_transactionsScalarWhereWithAggregatesInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                skipped_transactionsScalarWhereWithAggregatesInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      id: z
        .union([z.lazy(() => IntWithAggregatesFilterObjectSchema), z.number()])
        .optional(),
      blocknumber: z
        .union([z.lazy(() => IntWithAggregatesFilterObjectSchema), z.number()])
        .optional(),
      blockhash: z
        .union([
          z.lazy(() => StringWithAggregatesFilterObjectSchema),
          z.string(),
        ])
        .optional(),
      txhash: z
        .union([
          z.lazy(() => StringWithAggregatesFilterObjectSchema),
          z.string(),
        ])
        .optional(),
      created_at: z
        .union([
          z.lazy(() => DateTimeWithAggregatesFilterObjectSchema),
          z.coerce.date(),
        ])
        .optional(),
      updated_at: z
        .union([
          z.lazy(() => DateTimeWithAggregatesFilterObjectSchema),
          z.coerce.date(),
        ])
        .optional(),
      level: z
        .union([
          z.lazy(
            () =>
              EnumskippedtransactionlevelNullableWithAggregatesFilterObjectSchema,
          ),
          z.lazy(() => skippedtransactionlevelSchema),
        ])
        .optional()
        .nullable(),
    })
    .strict();

export const skipped_transactionsScalarWhereWithAggregatesInputObjectSchema =
  Schema;
