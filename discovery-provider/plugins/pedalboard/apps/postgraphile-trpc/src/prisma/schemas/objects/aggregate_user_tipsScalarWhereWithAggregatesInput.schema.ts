import { z } from 'zod';
import { IntWithAggregatesFilterObjectSchema } from './IntWithAggregatesFilter.schema';
import { BigIntWithAggregatesFilterObjectSchema } from './BigIntWithAggregatesFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_user_tipsScalarWhereWithAggregatesInput> =
  z
    .object({
      AND: z
        .union([
          z.lazy(
            () => aggregate_user_tipsScalarWhereWithAggregatesInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                aggregate_user_tipsScalarWhereWithAggregatesInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      OR: z
        .lazy(
          () => aggregate_user_tipsScalarWhereWithAggregatesInputObjectSchema,
        )
        .array()
        .optional(),
      NOT: z
        .union([
          z.lazy(
            () => aggregate_user_tipsScalarWhereWithAggregatesInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                aggregate_user_tipsScalarWhereWithAggregatesInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      sender_user_id: z
        .union([z.lazy(() => IntWithAggregatesFilterObjectSchema), z.number()])
        .optional(),
      receiver_user_id: z
        .union([z.lazy(() => IntWithAggregatesFilterObjectSchema), z.number()])
        .optional(),
      amount: z
        .union([
          z.lazy(() => BigIntWithAggregatesFilterObjectSchema),
          z.bigint(),
        ])
        .optional(),
    })
    .strict();

export const aggregate_user_tipsScalarWhereWithAggregatesInputObjectSchema =
  Schema;
