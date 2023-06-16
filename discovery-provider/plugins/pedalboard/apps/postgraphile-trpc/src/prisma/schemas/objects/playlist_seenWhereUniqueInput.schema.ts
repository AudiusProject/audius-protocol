import { z } from 'zod';
import { playlist_seenIs_currentUser_idPlaylist_idSeen_atCompoundUniqueInputObjectSchema } from './playlist_seenIs_currentUser_idPlaylist_idSeen_atCompoundUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.playlist_seenWhereUniqueInput> = z
  .object({
    is_current_user_id_playlist_id_seen_at: z
      .lazy(
        () =>
          playlist_seenIs_currentUser_idPlaylist_idSeen_atCompoundUniqueInputObjectSchema,
      )
      .optional(),
  })
  .strict();

export const playlist_seenWhereUniqueInputObjectSchema = Schema;
