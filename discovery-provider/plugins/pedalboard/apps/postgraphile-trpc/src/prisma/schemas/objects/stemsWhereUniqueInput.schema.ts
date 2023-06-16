import { z } from 'zod';
import { stemsParent_track_idChild_track_idCompoundUniqueInputObjectSchema } from './stemsParent_track_idChild_track_idCompoundUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.stemsWhereUniqueInput> = z
  .object({
    parent_track_id_child_track_id: z
      .lazy(
        () => stemsParent_track_idChild_track_idCompoundUniqueInputObjectSchema,
      )
      .optional(),
  })
  .strict();

export const stemsWhereUniqueInputObjectSchema = Schema;
