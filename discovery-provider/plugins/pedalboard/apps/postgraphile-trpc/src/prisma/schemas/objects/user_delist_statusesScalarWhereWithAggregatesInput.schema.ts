import { z } from 'zod';
import { DateTimeWithAggregatesFilterObjectSchema } from './DateTimeWithAggregatesFilter.schema';
import { IntWithAggregatesFilterObjectSchema } from './IntWithAggregatesFilter.schema';
import { BoolWithAggregatesFilterObjectSchema } from './BoolWithAggregatesFilter.schema';
import { Enumdelist_user_reasonWithAggregatesFilterObjectSchema } from './Enumdelist_user_reasonWithAggregatesFilter.schema';
import { delist_user_reasonSchema } from '../enums/delist_user_reason.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_delist_statusesScalarWhereWithAggregatesInput> =
  z
    .object({
      AND: z
        .union([
          z.lazy(
            () =>
              user_delist_statusesScalarWhereWithAggregatesInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                user_delist_statusesScalarWhereWithAggregatesInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      OR: z
        .lazy(
          () => user_delist_statusesScalarWhereWithAggregatesInputObjectSchema,
        )
        .array()
        .optional(),
      NOT: z
        .union([
          z.lazy(
            () =>
              user_delist_statusesScalarWhereWithAggregatesInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                user_delist_statusesScalarWhereWithAggregatesInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      created_at: z
        .union([
          z.lazy(() => DateTimeWithAggregatesFilterObjectSchema),
          z.coerce.date(),
        ])
        .optional(),
      user_id: z
        .union([z.lazy(() => IntWithAggregatesFilterObjectSchema), z.number()])
        .optional(),
      delisted: z
        .union([
          z.lazy(() => BoolWithAggregatesFilterObjectSchema),
          z.boolean(),
        ])
        .optional(),
      reason: z
        .union([
          z.lazy(() => Enumdelist_user_reasonWithAggregatesFilterObjectSchema),
          z.lazy(() => delist_user_reasonSchema),
        ])
        .optional(),
    })
    .strict();

export const user_delist_statusesScalarWhereWithAggregatesInputObjectSchema =
  Schema;
