import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_blocked_usersUncheckedCreateInput> = z
  .object({
    blocker_user_id: z.number(),
    blockee_user_id: z.number(),
    created_at: z.coerce.date().optional(),
  })
  .strict();

export const chat_blocked_usersUncheckedCreateInputObjectSchema = Schema;
