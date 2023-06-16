import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.User_balancesMinAggregateInputType> = z
  .object({
    user_id: z.literal(true).optional(),
    balance: z.literal(true).optional(),
    created_at: z.literal(true).optional(),
    updated_at: z.literal(true).optional(),
    associated_wallets_balance: z.literal(true).optional(),
    waudio: z.literal(true).optional(),
    associated_sol_wallets_balance: z.literal(true).optional(),
  })
  .strict();

export const User_balancesMinAggregateInputObjectSchema = Schema;
