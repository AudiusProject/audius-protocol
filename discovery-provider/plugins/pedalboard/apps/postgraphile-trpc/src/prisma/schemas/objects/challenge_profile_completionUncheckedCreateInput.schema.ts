import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.challenge_profile_completionUncheckedCreateInput> =
  z
    .object({
      user_id: z.number().optional(),
      profile_description: z.boolean(),
      profile_name: z.boolean(),
      profile_picture: z.boolean(),
      profile_cover_photo: z.boolean(),
      follows: z.boolean(),
      favorites: z.boolean(),
      reposts: z.boolean(),
    })
    .strict();

export const challenge_profile_completionUncheckedCreateInputObjectSchema =
  Schema;
