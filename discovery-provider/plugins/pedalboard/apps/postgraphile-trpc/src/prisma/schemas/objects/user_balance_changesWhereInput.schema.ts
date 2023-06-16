import { z } from 'zod';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_balance_changesWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => user_balance_changesWhereInputObjectSchema),
        z.lazy(() => user_balance_changesWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => user_balance_changesWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => user_balance_changesWhereInputObjectSchema),
        z.lazy(() => user_balance_changesWhereInputObjectSchema).array(),
      ])
      .optional(),
    user_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    blocknumber: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    current_balance: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    previous_balance: z
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

export const user_balance_changesWhereInputObjectSchema = Schema;
