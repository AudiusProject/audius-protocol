import { z } from 'zod';
import { StringWithAggregatesFilterObjectSchema } from './StringWithAggregatesFilter.schema';
import { StringNullableWithAggregatesFilterObjectSchema } from './StringNullableWithAggregatesFilter.schema';
import { JsonNullableWithAggregatesFilterObjectSchema } from './JsonNullableWithAggregatesFilter.schema';
import { IntNullableWithAggregatesFilterObjectSchema } from './IntNullableWithAggregatesFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.rpclogScalarWhereWithAggregatesInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => rpclogScalarWhereWithAggregatesInputObjectSchema),
        z.lazy(() => rpclogScalarWhereWithAggregatesInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => rpclogScalarWhereWithAggregatesInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => rpclogScalarWhereWithAggregatesInputObjectSchema),
        z.lazy(() => rpclogScalarWhereWithAggregatesInputObjectSchema).array(),
      ])
      .optional(),
    cuid: z
      .union([z.lazy(() => StringWithAggregatesFilterObjectSchema), z.string()])
      .optional(),
    wallet: z
      .union([
        z.lazy(() => StringNullableWithAggregatesFilterObjectSchema),
        z.string(),
      ])
      .optional()
      .nullable(),
    method: z
      .union([
        z.lazy(() => StringNullableWithAggregatesFilterObjectSchema),
        z.string(),
      ])
      .optional()
      .nullable(),
    params: z
      .lazy(() => JsonNullableWithAggregatesFilterObjectSchema)
      .optional(),
    jetstream_seq: z
      .union([
        z.lazy(() => IntNullableWithAggregatesFilterObjectSchema),
        z.number(),
      ])
      .optional()
      .nullable(),
  })
  .strict();

export const rpclogScalarWhereWithAggregatesInputObjectSchema = Schema;
