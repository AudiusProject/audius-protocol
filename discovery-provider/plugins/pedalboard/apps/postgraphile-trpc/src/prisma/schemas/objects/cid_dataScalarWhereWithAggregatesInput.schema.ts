import { z } from 'zod';
import { StringWithAggregatesFilterObjectSchema } from './StringWithAggregatesFilter.schema';
import { StringNullableWithAggregatesFilterObjectSchema } from './StringNullableWithAggregatesFilter.schema';
import { JsonNullableWithAggregatesFilterObjectSchema } from './JsonNullableWithAggregatesFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.cid_dataScalarWhereWithAggregatesInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => cid_dataScalarWhereWithAggregatesInputObjectSchema),
        z
          .lazy(() => cid_dataScalarWhereWithAggregatesInputObjectSchema)
          .array(),
      ])
      .optional(),
    OR: z
      .lazy(() => cid_dataScalarWhereWithAggregatesInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => cid_dataScalarWhereWithAggregatesInputObjectSchema),
        z
          .lazy(() => cid_dataScalarWhereWithAggregatesInputObjectSchema)
          .array(),
      ])
      .optional(),
    cid: z
      .union([z.lazy(() => StringWithAggregatesFilterObjectSchema), z.string()])
      .optional(),
    type: z
      .union([
        z.lazy(() => StringNullableWithAggregatesFilterObjectSchema),
        z.string(),
      ])
      .optional()
      .nullable(),
    data: z.lazy(() => JsonNullableWithAggregatesFilterObjectSchema).optional(),
  })
  .strict();

export const cid_dataScalarWhereWithAggregatesInputObjectSchema = Schema;
