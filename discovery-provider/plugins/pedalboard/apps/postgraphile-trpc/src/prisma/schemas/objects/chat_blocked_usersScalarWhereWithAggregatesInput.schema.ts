import { z } from 'zod';
import { IntWithAggregatesFilterObjectSchema } from './IntWithAggregatesFilter.schema';
import { DateTimeWithAggregatesFilterObjectSchema } from './DateTimeWithAggregatesFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_blocked_usersScalarWhereWithAggregatesInput> =
  z
    .object({
      AND: z
        .union([
          z.lazy(
            () => chat_blocked_usersScalarWhereWithAggregatesInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                chat_blocked_usersScalarWhereWithAggregatesInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      OR: z
        .lazy(
          () => chat_blocked_usersScalarWhereWithAggregatesInputObjectSchema,
        )
        .array()
        .optional(),
      NOT: z
        .union([
          z.lazy(
            () => chat_blocked_usersScalarWhereWithAggregatesInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                chat_blocked_usersScalarWhereWithAggregatesInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      blocker_user_id: z
        .union([z.lazy(() => IntWithAggregatesFilterObjectSchema), z.number()])
        .optional(),
      blockee_user_id: z
        .union([z.lazy(() => IntWithAggregatesFilterObjectSchema), z.number()])
        .optional(),
      created_at: z
        .union([
          z.lazy(() => DateTimeWithAggregatesFilterObjectSchema),
          z.coerce.date(),
        ])
        .optional(),
    })
    .strict();

export const chat_blocked_usersScalarWhereWithAggregatesInputObjectSchema =
  Schema;
