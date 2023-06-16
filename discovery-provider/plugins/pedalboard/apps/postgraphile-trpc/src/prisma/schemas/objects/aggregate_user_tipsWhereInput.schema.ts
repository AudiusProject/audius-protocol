import { z } from 'zod';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { BigIntFilterObjectSchema } from './BigIntFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_user_tipsWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => aggregate_user_tipsWhereInputObjectSchema),
        z.lazy(() => aggregate_user_tipsWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => aggregate_user_tipsWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => aggregate_user_tipsWhereInputObjectSchema),
        z.lazy(() => aggregate_user_tipsWhereInputObjectSchema).array(),
      ])
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
  })
  .strict();

export const aggregate_user_tipsWhereInputObjectSchema = Schema;
