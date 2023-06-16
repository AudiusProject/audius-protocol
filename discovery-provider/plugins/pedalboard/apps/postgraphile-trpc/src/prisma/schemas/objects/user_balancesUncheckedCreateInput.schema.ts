import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_balancesUncheckedCreateInput> = z
  .object({
    user_id: z.number().optional(),
    balance: z.string(),
    created_at: z.coerce.date().optional(),
    updated_at: z.coerce.date().optional(),
    associated_wallets_balance: z.string().optional(),
    waudio: z.string().optional().nullable(),
    associated_sol_wallets_balance: z.string().optional(),
  })
  .strict();

export const user_balancesUncheckedCreateInputObjectSchema = Schema;
