import { z } from 'zod';
import { delist_track_reasonSchema } from '../enums/delist_track_reason.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Enumdelist_track_reasonFieldUpdateOperationsInput> =
  z
    .object({
      set: z.lazy(() => delist_track_reasonSchema).optional(),
    })
    .strict();

export const Enumdelist_track_reasonFieldUpdateOperationsInputObjectSchema =
  Schema;
