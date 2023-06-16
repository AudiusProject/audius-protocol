import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.stemsParent_track_idChild_track_idCompoundUniqueInput> =
  z
    .object({
      parent_track_id: z.number(),
      child_track_id: z.number(),
    })
    .strict();

export const stemsParent_track_idChild_track_idCompoundUniqueInputObjectSchema =
  Schema;
