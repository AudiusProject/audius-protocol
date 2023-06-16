import { z } from 'zod';
import { user_challengesChallenge_idSpecifierCompoundUniqueInputObjectSchema } from './user_challengesChallenge_idSpecifierCompoundUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_challengesWhereUniqueInput> = z
  .object({
    challenge_id_specifier: z
      .lazy(
        () =>
          user_challengesChallenge_idSpecifierCompoundUniqueInputObjectSchema,
      )
      .optional(),
  })
  .strict();

export const user_challengesWhereUniqueInputObjectSchema = Schema;
