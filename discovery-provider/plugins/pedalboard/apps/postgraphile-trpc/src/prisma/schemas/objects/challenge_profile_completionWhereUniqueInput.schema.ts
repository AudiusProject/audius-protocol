import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.challenge_profile_completionWhereUniqueInput> = z
  .object({
    user_id: z.number().optional(),
  })
  .strict();

export const challenge_profile_completionWhereUniqueInputObjectSchema = Schema;
