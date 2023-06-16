import { z } from 'zod';
import { IntWithAggregatesFilterObjectSchema } from './IntWithAggregatesFilter.schema';
import { StringWithAggregatesFilterObjectSchema } from './StringWithAggregatesFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_pubkeysScalarWhereWithAggregatesInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => user_pubkeysScalarWhereWithAggregatesInputObjectSchema),
        z
          .lazy(() => user_pubkeysScalarWhereWithAggregatesInputObjectSchema)
          .array(),
      ])
      .optional(),
    OR: z
      .lazy(() => user_pubkeysScalarWhereWithAggregatesInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => user_pubkeysScalarWhereWithAggregatesInputObjectSchema),
        z
          .lazy(() => user_pubkeysScalarWhereWithAggregatesInputObjectSchema)
          .array(),
      ])
      .optional(),
    user_id: z
      .union([z.lazy(() => IntWithAggregatesFilterObjectSchema), z.number()])
      .optional(),
    pubkey_base64: z
      .union([z.lazy(() => StringWithAggregatesFilterObjectSchema), z.string()])
      .optional(),
  })
  .strict();

export const user_pubkeysScalarWhereWithAggregatesInputObjectSchema = Schema;
