import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.track_routesOwner_idSlugCompoundUniqueInput> = z
  .object({
    owner_id: z.number(),
    slug: z.string(),
  })
  .strict();

export const track_routesOwner_idSlugCompoundUniqueInputObjectSchema = Schema;
