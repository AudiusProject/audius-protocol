import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.notification_seenUncheckedCreateInput> = z
  .object({
    user_id: z.number(),
    seen_at: z.coerce.date(),
    blocknumber: z.number().optional().nullable(),
    blockhash: z.string().optional().nullable(),
    txhash: z.string().optional().nullable(),
  })
  .strict();

export const notification_seenUncheckedCreateInputObjectSchema = Schema;
