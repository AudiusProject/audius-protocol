import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_balance_changesCreateInput> = z
  .object({
    blocknumber: z.number(),
    current_balance: z.string(),
    previous_balance: z.string(),
    created_at: z.coerce.date().optional(),
    updated_at: z.coerce.date().optional(),
  })
  .strict();

export const user_balance_changesCreateInputObjectSchema = Schema;
