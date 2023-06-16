import { z } from 'zod';
import { delist_track_reasonSchema } from '../enums/delist_track_reason.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.track_delist_statusesCreateManyInput> = z
  .object({
    created_at: z.coerce.date(),
    track_id: z.number(),
    owner_id: z.number(),
    track_cid: z.string(),
    delisted: z.boolean(),
    reason: z.lazy(() => delist_track_reasonSchema),
  })
  .strict();

export const track_delist_statusesCreateManyInputObjectSchema = Schema;
