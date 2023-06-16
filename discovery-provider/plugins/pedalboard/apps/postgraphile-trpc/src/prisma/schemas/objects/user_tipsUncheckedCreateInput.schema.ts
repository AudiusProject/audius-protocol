import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_tipsUncheckedCreateInput> = z
  .object({
    slot: z.number(),
    signature: z.string(),
    sender_user_id: z.number(),
    receiver_user_id: z.number(),
    amount: z.bigint(),
    created_at: z.coerce.date().optional(),
    updated_at: z.coerce.date().optional(),
  })
  .strict();

export const user_tipsUncheckedCreateInputObjectSchema = Schema;
