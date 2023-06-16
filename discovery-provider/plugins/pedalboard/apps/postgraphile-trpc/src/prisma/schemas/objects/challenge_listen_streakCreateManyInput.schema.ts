import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.challenge_listen_streakCreateManyInput> = z
  .object({
    user_id: z.number().optional(),
    last_listen_date: z.coerce.date().optional().nullable(),
    listen_streak: z.number(),
  })
  .strict();

export const challenge_listen_streakCreateManyInputObjectSchema = Schema;
