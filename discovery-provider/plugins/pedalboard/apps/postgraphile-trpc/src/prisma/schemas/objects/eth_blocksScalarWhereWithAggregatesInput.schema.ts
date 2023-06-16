import { z } from 'zod';
import { IntWithAggregatesFilterObjectSchema } from './IntWithAggregatesFilter.schema';
import { DateTimeWithAggregatesFilterObjectSchema } from './DateTimeWithAggregatesFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.eth_blocksScalarWhereWithAggregatesInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => eth_blocksScalarWhereWithAggregatesInputObjectSchema),
        z
          .lazy(() => eth_blocksScalarWhereWithAggregatesInputObjectSchema)
          .array(),
      ])
      .optional(),
    OR: z
      .lazy(() => eth_blocksScalarWhereWithAggregatesInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => eth_blocksScalarWhereWithAggregatesInputObjectSchema),
        z
          .lazy(() => eth_blocksScalarWhereWithAggregatesInputObjectSchema)
          .array(),
      ])
      .optional(),
    last_scanned_block: z
      .union([z.lazy(() => IntWithAggregatesFilterObjectSchema), z.number()])
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
  })
  .strict();

export const eth_blocksScalarWhereWithAggregatesInputObjectSchema = Schema;
