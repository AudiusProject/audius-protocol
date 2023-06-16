import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_challengesChallenge_idSpecifierCompoundUniqueInput> =
  z
    .object({
      challenge_id: z.string(),
      specifier: z.string(),
    })
    .strict();

export const user_challengesChallenge_idSpecifierCompoundUniqueInputObjectSchema =
  Schema;
