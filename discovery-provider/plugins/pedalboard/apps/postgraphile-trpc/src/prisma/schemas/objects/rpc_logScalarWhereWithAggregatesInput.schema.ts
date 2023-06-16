import { z } from 'zod';
import { DateTimeWithAggregatesFilterObjectSchema } from './DateTimeWithAggregatesFilter.schema';
import { StringWithAggregatesFilterObjectSchema } from './StringWithAggregatesFilter.schema';
import { JsonWithAggregatesFilterObjectSchema } from './JsonWithAggregatesFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.rpc_logScalarWhereWithAggregatesInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => rpc_logScalarWhereWithAggregatesInputObjectSchema),
        z.lazy(() => rpc_logScalarWhereWithAggregatesInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => rpc_logScalarWhereWithAggregatesInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => rpc_logScalarWhereWithAggregatesInputObjectSchema),
        z.lazy(() => rpc_logScalarWhereWithAggregatesInputObjectSchema).array(),
      ])
      .optional(),
    relayed_at: z
      .union([
        z.lazy(() => DateTimeWithAggregatesFilterObjectSchema),
        z.coerce.date(),
      ])
      .optional(),
    from_wallet: z
      .union([z.lazy(() => StringWithAggregatesFilterObjectSchema), z.string()])
      .optional(),
    rpc: z.lazy(() => JsonWithAggregatesFilterObjectSchema).optional(),
    sig: z
      .union([z.lazy(() => StringWithAggregatesFilterObjectSchema), z.string()])
      .optional(),
    relayed_by: z
      .union([z.lazy(() => StringWithAggregatesFilterObjectSchema), z.string()])
      .optional(),
    applied_at: z
      .union([
        z.lazy(() => DateTimeWithAggregatesFilterObjectSchema),
        z.coerce.date(),
      ])
      .optional(),
  })
  .strict();

export const rpc_logScalarWhereWithAggregatesInputObjectSchema = Schema;
