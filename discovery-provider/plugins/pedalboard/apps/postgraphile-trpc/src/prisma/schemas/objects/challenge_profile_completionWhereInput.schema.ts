import { z } from 'zod';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { BoolFilterObjectSchema } from './BoolFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.challenge_profile_completionWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => challenge_profile_completionWhereInputObjectSchema),
        z
          .lazy(() => challenge_profile_completionWhereInputObjectSchema)
          .array(),
      ])
      .optional(),
    OR: z
      .lazy(() => challenge_profile_completionWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => challenge_profile_completionWhereInputObjectSchema),
        z
          .lazy(() => challenge_profile_completionWhereInputObjectSchema)
          .array(),
      ])
      .optional(),
    user_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    profile_description: z
      .union([z.lazy(() => BoolFilterObjectSchema), z.boolean()])
      .optional(),
    profile_name: z
      .union([z.lazy(() => BoolFilterObjectSchema), z.boolean()])
      .optional(),
    profile_picture: z
      .union([z.lazy(() => BoolFilterObjectSchema), z.boolean()])
      .optional(),
    profile_cover_photo: z
      .union([z.lazy(() => BoolFilterObjectSchema), z.boolean()])
      .optional(),
    follows: z
      .union([z.lazy(() => BoolFilterObjectSchema), z.boolean()])
      .optional(),
    favorites: z
      .union([z.lazy(() => BoolFilterObjectSchema), z.boolean()])
      .optional(),
    reposts: z
      .union([z.lazy(() => BoolFilterObjectSchema), z.boolean()])
      .optional(),
  })
  .strict();

export const challenge_profile_completionWhereInputObjectSchema = Schema;
