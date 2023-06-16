import { z } from 'zod';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { JsonFilterObjectSchema } from './JsonFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.rpc_logWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => rpc_logWhereInputObjectSchema),
        z.lazy(() => rpc_logWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => rpc_logWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => rpc_logWhereInputObjectSchema),
        z.lazy(() => rpc_logWhereInputObjectSchema).array(),
      ])
      .optional(),
    relayed_at: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
    from_wallet: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    rpc: z.lazy(() => JsonFilterObjectSchema).optional(),
    sig: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    relayed_by: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    applied_at: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
  })
  .strict();

export const rpc_logWhereInputObjectSchema = Schema;
