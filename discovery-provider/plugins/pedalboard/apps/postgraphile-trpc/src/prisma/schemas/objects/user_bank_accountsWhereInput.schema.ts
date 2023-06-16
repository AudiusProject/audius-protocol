import { z } from 'zod';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_bank_accountsWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => user_bank_accountsWhereInputObjectSchema),
        z.lazy(() => user_bank_accountsWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => user_bank_accountsWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => user_bank_accountsWhereInputObjectSchema),
        z.lazy(() => user_bank_accountsWhereInputObjectSchema).array(),
      ])
      .optional(),
    signature: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    ethereum_address: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    created_at: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
    bank_account: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
  })
  .strict();

export const user_bank_accountsWhereInputObjectSchema = Schema;
