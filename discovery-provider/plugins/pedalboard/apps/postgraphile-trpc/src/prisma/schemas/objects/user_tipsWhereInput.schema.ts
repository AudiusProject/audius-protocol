import { z } from 'zod';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { BigIntFilterObjectSchema } from './BigIntFilter.schema';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_tipsWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => user_tipsWhereInputObjectSchema),
        z.lazy(() => user_tipsWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => user_tipsWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => user_tipsWhereInputObjectSchema),
        z.lazy(() => user_tipsWhereInputObjectSchema).array(),
      ])
      .optional(),
    slot: z.union([z.lazy(() => IntFilterObjectSchema), z.number()]).optional(),
    signature: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    sender_user_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    receiver_user_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    amount: z
      .union([z.lazy(() => BigIntFilterObjectSchema), z.bigint()])
      .optional(),
    created_at: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
    updated_at: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
  })
  .strict();

export const user_tipsWhereInputObjectSchema = Schema;
