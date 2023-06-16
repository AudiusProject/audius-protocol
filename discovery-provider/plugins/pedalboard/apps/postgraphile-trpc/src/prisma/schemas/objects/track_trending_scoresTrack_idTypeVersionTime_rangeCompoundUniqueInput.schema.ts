import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.track_trending_scoresTrack_idTypeVersionTime_rangeCompoundUniqueInput> =
  z
    .object({
      track_id: z.number(),
      type: z.string(),
      version: z.string(),
      time_range: z.string(),
    })
    .strict();

export const track_trending_scoresTrack_idTypeVersionTime_rangeCompoundUniqueInputObjectSchema =
  Schema;
