import { z } from 'zod';
import { track_routesOwner_idSlugCompoundUniqueInputObjectSchema } from './track_routesOwner_idSlugCompoundUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.track_routesWhereUniqueInput> = z
  .object({
    owner_id_slug: z
      .lazy(() => track_routesOwner_idSlugCompoundUniqueInputObjectSchema)
      .optional(),
  })
  .strict();

export const track_routesWhereUniqueInputObjectSchema = Schema;
