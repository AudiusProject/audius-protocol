import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_bank_accountsUncheckedCreateInput> = z
  .object({
    signature: z.string(),
    ethereum_address: z.string(),
    created_at: z.coerce.date(),
    bank_account: z.string(),
  })
  .strict();

export const user_bank_accountsUncheckedCreateInputObjectSchema = Schema;
