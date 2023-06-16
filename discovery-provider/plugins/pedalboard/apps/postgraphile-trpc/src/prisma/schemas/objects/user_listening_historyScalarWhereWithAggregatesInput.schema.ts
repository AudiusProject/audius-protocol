import { z } from 'zod';
import { IntWithAggregatesFilterObjectSchema } from './IntWithAggregatesFilter.schema';
import { JsonWithAggregatesFilterObjectSchema } from './JsonWithAggregatesFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_listening_historyScalarWhereWithAggregatesInput> =
  z
    .object({
      AND: z
        .union([
          z.lazy(
            () =>
              user_listening_historyScalarWhereWithAggregatesInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                user_listening_historyScalarWhereWithAggregatesInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      OR: z
        .lazy(
          () =>
            user_listening_historyScalarWhereWithAggregatesInputObjectSchema,
        )
        .array()
        .optional(),
      NOT: z
        .union([
          z.lazy(
            () =>
              user_listening_historyScalarWhereWithAggregatesInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                user_listening_historyScalarWhereWithAggregatesInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      user_id: z
        .union([z.lazy(() => IntWithAggregatesFilterObjectSchema), z.number()])
        .optional(),
      listening_history: z
        .lazy(() => JsonWithAggregatesFilterObjectSchema)
        .optional(),
    })
    .strict();

export const user_listening_historyScalarWhereWithAggregatesInputObjectSchema =
  Schema;
