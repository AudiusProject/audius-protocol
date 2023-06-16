import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.track_delist_statusesCreated_atTrack_idDelistedCompoundUniqueInput> =
  z
    .object({
      created_at: z.coerce.date(),
      track_id: z.number(),
      delisted: z.boolean(),
    })
    .strict();

export const track_delist_statusesCreated_atTrack_idDelistedCompoundUniqueInputObjectSchema =
  Schema;
