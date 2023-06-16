import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.playlist_seenIs_currentUser_idPlaylist_idSeen_atCompoundUniqueInput> =
  z
    .object({
      is_current: z.boolean(),
      user_id: z.number(),
      playlist_id: z.number(),
      seen_at: z.coerce.date(),
    })
    .strict();

export const playlist_seenIs_currentUser_idPlaylist_idSeen_atCompoundUniqueInputObjectSchema =
  Schema;
