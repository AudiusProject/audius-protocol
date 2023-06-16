import { z } from 'zod';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.rpc_cursorWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => rpc_cursorWhereInputObjectSchema),
        z.lazy(() => rpc_cursorWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => rpc_cursorWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => rpc_cursorWhereInputObjectSchema),
        z.lazy(() => rpc_cursorWhereInputObjectSchema).array(),
      ])
      .optional(),
    relayed_by: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    relayed_at: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
  })
  .strict();

export const rpc_cursorWhereInputObjectSchema = Schema;
