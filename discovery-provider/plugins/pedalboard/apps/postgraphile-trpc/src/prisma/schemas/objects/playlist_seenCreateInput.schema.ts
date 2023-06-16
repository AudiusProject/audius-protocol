import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.playlist_seenCreateInput> = z
  .object({
    user_id: z.number(),
    playlist_id: z.number(),
    seen_at: z.coerce.date(),
    is_current: z.boolean(),
    blocknumber: z.number().optional().nullable(),
    blockhash: z.string().optional().nullable(),
    txhash: z.string().optional().nullable(),
  })
  .strict();

export const playlist_seenCreateInputObjectSchema = Schema;
