import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_playlistUncheckedCreateInput> = z
  .object({
    playlist_id: z.number(),
    is_album: z.boolean().optional().nullable(),
    repost_count: z.number().optional().nullable(),
    save_count: z.number().optional().nullable(),
  })
  .strict();

export const aggregate_playlistUncheckedCreateInputObjectSchema = Schema;
