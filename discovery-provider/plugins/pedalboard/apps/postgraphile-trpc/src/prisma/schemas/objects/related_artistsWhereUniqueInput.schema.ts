import { z } from 'zod';
import { related_artistsUser_idRelated_artist_user_idCompoundUniqueInputObjectSchema } from './related_artistsUser_idRelated_artist_user_idCompoundUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.related_artistsWhereUniqueInput> = z
  .object({
    user_id_related_artist_user_id: z
      .lazy(
        () =>
          related_artistsUser_idRelated_artist_user_idCompoundUniqueInputObjectSchema,
      )
      .optional(),
  })
  .strict();

export const related_artistsWhereUniqueInputObjectSchema = Schema;
