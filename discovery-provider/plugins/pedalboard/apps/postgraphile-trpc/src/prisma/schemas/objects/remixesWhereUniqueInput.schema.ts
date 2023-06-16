import { z } from 'zod';
import { remixesParent_track_idChild_track_idCompoundUniqueInputObjectSchema } from './remixesParent_track_idChild_track_idCompoundUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.remixesWhereUniqueInput> = z
  .object({
    parent_track_id_child_track_id: z
      .lazy(
        () =>
          remixesParent_track_idChild_track_idCompoundUniqueInputObjectSchema,
      )
      .optional(),
  })
  .strict();

export const remixesWhereUniqueInputObjectSchema = Schema;
