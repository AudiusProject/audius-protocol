import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.tracksIs_currentTrack_idTxhashCompoundUniqueInput> =
  z
    .object({
      is_current: z.boolean(),
      track_id: z.number(),
      txhash: z.string(),
    })
    .strict();

export const tracksIs_currentTrack_idTxhashCompoundUniqueInputObjectSchema =
  Schema;
