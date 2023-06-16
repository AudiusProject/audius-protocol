import { z } from 'zod';
import { track_trending_scoresTrack_idTypeVersionTime_rangeCompoundUniqueInputObjectSchema } from './track_trending_scoresTrack_idTypeVersionTime_rangeCompoundUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.track_trending_scoresWhereUniqueInput> = z
  .object({
    track_id_type_version_time_range: z
      .lazy(
        () =>
          track_trending_scoresTrack_idTypeVersionTime_rangeCompoundUniqueInputObjectSchema,
      )
      .optional(),
  })
  .strict();

export const track_trending_scoresWhereUniqueInputObjectSchema = Schema;
