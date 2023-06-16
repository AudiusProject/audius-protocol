import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.related_artistsUser_idRelated_artist_user_idCompoundUniqueInput> =
  z
    .object({
      user_id: z.number(),
      related_artist_user_id: z.number(),
    })
    .strict();

export const related_artistsUser_idRelated_artist_user_idCompoundUniqueInputObjectSchema =
  Schema;
