import { z } from 'zod';
import { playlist_routesOwner_idSlugCompoundUniqueInputObjectSchema } from './playlist_routesOwner_idSlugCompoundUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.playlist_routesWhereUniqueInput> = z
  .object({
    owner_id_slug: z
      .lazy(() => playlist_routesOwner_idSlugCompoundUniqueInputObjectSchema)
      .optional(),
  })
  .strict();

export const playlist_routesWhereUniqueInputObjectSchema = Schema;
