import { z } from 'zod';
import { IntWithAggregatesFilterObjectSchema } from './IntWithAggregatesFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_banScalarWhereWithAggregatesInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => chat_banScalarWhereWithAggregatesInputObjectSchema),
        z
          .lazy(() => chat_banScalarWhereWithAggregatesInputObjectSchema)
          .array(),
      ])
      .optional(),
    OR: z
      .lazy(() => chat_banScalarWhereWithAggregatesInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => chat_banScalarWhereWithAggregatesInputObjectSchema),
        z
          .lazy(() => chat_banScalarWhereWithAggregatesInputObjectSchema)
          .array(),
      ])
      .optional(),
    user_id: z
      .union([z.lazy(() => IntWithAggregatesFilterObjectSchema), z.number()])
      .optional(),
  })
  .strict();

export const chat_banScalarWhereWithAggregatesInputObjectSchema = Schema;
