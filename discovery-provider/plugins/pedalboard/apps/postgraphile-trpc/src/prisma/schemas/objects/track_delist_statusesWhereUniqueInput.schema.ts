import { z } from 'zod';
import { track_delist_statusesCreated_atTrack_idDelistedCompoundUniqueInputObjectSchema } from './track_delist_statusesCreated_atTrack_idDelistedCompoundUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.track_delist_statusesWhereUniqueInput> = z
  .object({
    created_at_track_id_delisted: z
      .lazy(
        () =>
          track_delist_statusesCreated_atTrack_idDelistedCompoundUniqueInputObjectSchema,
      )
      .optional(),
  })
  .strict();

export const track_delist_statusesWhereUniqueInputObjectSchema = Schema;
