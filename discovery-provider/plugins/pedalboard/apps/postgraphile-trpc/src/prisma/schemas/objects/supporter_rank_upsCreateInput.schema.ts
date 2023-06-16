import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.supporter_rank_upsCreateInput> = z
  .object({
    slot: z.number(),
    sender_user_id: z.number(),
    receiver_user_id: z.number(),
    rank: z.number(),
  })
  .strict();

export const supporter_rank_upsCreateInputObjectSchema = Schema;
