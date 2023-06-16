import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.challenge_disbursementsChallenge_idSpecifierCompoundUniqueInput> =
  z
    .object({
      challenge_id: z.string(),
      specifier: z.string(),
    })
    .strict();

export const challenge_disbursementsChallenge_idSpecifierCompoundUniqueInputObjectSchema =
  Schema;
