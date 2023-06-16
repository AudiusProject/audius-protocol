import { z } from 'zod';
import { StringWithAggregatesFilterObjectSchema } from './StringWithAggregatesFilter.schema';
import { StringNullableWithAggregatesFilterObjectSchema } from './StringNullableWithAggregatesFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.pubkeysScalarWhereWithAggregatesInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => pubkeysScalarWhereWithAggregatesInputObjectSchema),
        z.lazy(() => pubkeysScalarWhereWithAggregatesInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => pubkeysScalarWhereWithAggregatesInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => pubkeysScalarWhereWithAggregatesInputObjectSchema),
        z.lazy(() => pubkeysScalarWhereWithAggregatesInputObjectSchema).array(),
      ])
      .optional(),
    wallet: z
      .union([z.lazy(() => StringWithAggregatesFilterObjectSchema), z.string()])
      .optional(),
    pubkey: z
      .union([
        z.lazy(() => StringNullableWithAggregatesFilterObjectSchema),
        z.string(),
      ])
      .optional()
      .nullable(),
  })
  .strict();

export const pubkeysScalarWhereWithAggregatesInputObjectSchema = Schema;
