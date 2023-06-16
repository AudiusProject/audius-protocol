import { z } from 'zod';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.spl_token_txWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => spl_token_txWhereInputObjectSchema),
        z.lazy(() => spl_token_txWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => spl_token_txWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => spl_token_txWhereInputObjectSchema),
        z.lazy(() => spl_token_txWhereInputObjectSchema).array(),
      ])
      .optional(),
    last_scanned_slot: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    signature: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    created_at: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
    updated_at: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
  })
  .strict();

export const spl_token_txWhereInputObjectSchema = Schema;
