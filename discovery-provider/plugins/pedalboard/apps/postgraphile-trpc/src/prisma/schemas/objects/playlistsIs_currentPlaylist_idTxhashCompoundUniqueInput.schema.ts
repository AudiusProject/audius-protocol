import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.playlistsIs_currentPlaylist_idTxhashCompoundUniqueInput> =
  z
    .object({
      is_current: z.boolean(),
      playlist_id: z.number(),
      txhash: z.string(),
    })
    .strict();

export const playlistsIs_currentPlaylist_idTxhashCompoundUniqueInputObjectSchema =
  Schema;
