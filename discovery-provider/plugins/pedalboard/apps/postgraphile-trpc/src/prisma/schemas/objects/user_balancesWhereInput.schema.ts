import { z } from 'zod';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';
import { StringNullableFilterObjectSchema } from './StringNullableFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_balancesWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => user_balancesWhereInputObjectSchema),
        z.lazy(() => user_balancesWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => user_balancesWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => user_balancesWhereInputObjectSchema),
        z.lazy(() => user_balancesWhereInputObjectSchema).array(),
      ])
      .optional(),
    user_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    balance: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    created_at: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
    updated_at: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
    associated_wallets_balance: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    waudio: z
      .union([z.lazy(() => StringNullableFilterObjectSchema), z.string()])
      .optional()
      .nullable(),
    associated_sol_wallets_balance: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
  })
  .strict();

export const user_balancesWhereInputObjectSchema = Schema;
