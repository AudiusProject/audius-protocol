import { z } from 'zod';
import { tracksIs_currentTrack_idTxhashCompoundUniqueInputObjectSchema } from './tracksIs_currentTrack_idTxhashCompoundUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.tracksWhereUniqueInput> = z
  .object({
    is_current_track_id_txhash: z
      .lazy(() => tracksIs_currentTrack_idTxhashCompoundUniqueInputObjectSchema)
      .optional(),
  })
  .strict();

export const tracksWhereUniqueInputObjectSchema = Schema;
