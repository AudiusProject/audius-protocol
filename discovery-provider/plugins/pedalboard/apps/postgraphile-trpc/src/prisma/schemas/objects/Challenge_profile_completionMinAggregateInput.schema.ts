import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Challenge_profile_completionMinAggregateInputType> =
  z
    .object({
      user_id: z.literal(true).optional(),
      profile_description: z.literal(true).optional(),
      profile_name: z.literal(true).optional(),
      profile_picture: z.literal(true).optional(),
      profile_cover_photo: z.literal(true).optional(),
      follows: z.literal(true).optional(),
      favorites: z.literal(true).optional(),
      reposts: z.literal(true).optional(),
    })
    .strict();

export const Challenge_profile_completionMinAggregateInputObjectSchema = Schema;
