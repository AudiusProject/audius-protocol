import { z } from 'zod';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.rewards_manager_backfill_txsWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => rewards_manager_backfill_txsWhereInputObjectSchema),
        z
          .lazy(() => rewards_manager_backfill_txsWhereInputObjectSchema)
          .array(),
      ])
      .optional(),
    OR: z
      .lazy(() => rewards_manager_backfill_txsWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => rewards_manager_backfill_txsWhereInputObjectSchema),
        z
          .lazy(() => rewards_manager_backfill_txsWhereInputObjectSchema)
          .array(),
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

export const rewards_manager_backfill_txsWhereInputObjectSchema = Schema;
