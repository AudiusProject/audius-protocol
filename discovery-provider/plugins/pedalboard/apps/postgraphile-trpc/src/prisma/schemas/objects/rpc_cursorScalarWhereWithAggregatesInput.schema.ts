import { z } from 'zod';
import { StringWithAggregatesFilterObjectSchema } from './StringWithAggregatesFilter.schema';
import { DateTimeWithAggregatesFilterObjectSchema } from './DateTimeWithAggregatesFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.rpc_cursorScalarWhereWithAggregatesInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => rpc_cursorScalarWhereWithAggregatesInputObjectSchema),
        z
          .lazy(() => rpc_cursorScalarWhereWithAggregatesInputObjectSchema)
          .array(),
      ])
      .optional(),
    OR: z
      .lazy(() => rpc_cursorScalarWhereWithAggregatesInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => rpc_cursorScalarWhereWithAggregatesInputObjectSchema),
        z
          .lazy(() => rpc_cursorScalarWhereWithAggregatesInputObjectSchema)
          .array(),
      ])
      .optional(),
    relayed_by: z
      .union([z.lazy(() => StringWithAggregatesFilterObjectSchema), z.string()])
      .optional(),
    relayed_at: z
      .union([
        z.lazy(() => DateTimeWithAggregatesFilterObjectSchema),
        z.coerce.date(),
      ])
      .optional(),
  })
  .strict();

export const rpc_cursorScalarWhereWithAggregatesInputObjectSchema = Schema;
