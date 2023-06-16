import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_balance_changesCreateManyInput> = z
  .object({
    user_id: z.number().optional(),
    blocknumber: z.number(),
    current_balance: z.string(),
    previous_balance: z.string(),
    created_at: z.coerce.date().optional(),
    updated_at: z.coerce.date().optional(),
  })
  .strict();

export const user_balance_changesCreateManyInputObjectSchema = Schema;
