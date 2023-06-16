import { z } from 'zod';
import { challenge_disbursementsChallenge_idSpecifierCompoundUniqueInputObjectSchema } from './challenge_disbursementsChallenge_idSpecifierCompoundUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.challenge_disbursementsWhereUniqueInput> = z
  .object({
    challenge_id_specifier: z
      .lazy(
        () =>
          challenge_disbursementsChallenge_idSpecifierCompoundUniqueInputObjectSchema,
      )
      .optional(),
  })
  .strict();

export const challenge_disbursementsWhereUniqueInputObjectSchema = Schema;
