import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.challenge_listen_streakWhereUniqueInput> = z
  .object({
    user_id: z.number().optional(),
  })
  .strict();

export const challenge_listen_streakWhereUniqueInputObjectSchema = Schema;
