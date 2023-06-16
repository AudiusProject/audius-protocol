import { z } from 'zod';
import { playlistsIs_currentPlaylist_idTxhashCompoundUniqueInputObjectSchema } from './playlistsIs_currentPlaylist_idTxhashCompoundUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.playlistsWhereUniqueInput> = z
  .object({
    is_current_playlist_id_txhash: z
      .lazy(
        () =>
          playlistsIs_currentPlaylist_idTxhashCompoundUniqueInputObjectSchema,
      )
      .optional(),
  })
  .strict();

export const playlistsWhereUniqueInputObjectSchema = Schema;
