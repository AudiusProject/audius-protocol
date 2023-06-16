import { z } from 'zod';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_bank_txsWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => user_bank_txsWhereInputObjectSchema),
        z.lazy(() => user_bank_txsWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => user_bank_txsWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => user_bank_txsWhereInputObjectSchema),
        z.lazy(() => user_bank_txsWhereInputObjectSchema).array(),
      ])
      .optional(),
    signature: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    slot: z.union([z.lazy(() => IntFilterObjectSchema), z.number()]).optional(),
    created_at: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
  })
  .strict();

export const user_bank_txsWhereInputObjectSchema = Schema;
