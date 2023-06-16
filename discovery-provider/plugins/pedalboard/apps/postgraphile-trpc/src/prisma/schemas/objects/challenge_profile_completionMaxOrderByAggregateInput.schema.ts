import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.challenge_profile_completionMaxOrderByAggregateInput> =
  z
    .object({
      user_id: z.lazy(() => SortOrderSchema).optional(),
      profile_description: z.lazy(() => SortOrderSchema).optional(),
      profile_name: z.lazy(() => SortOrderSchema).optional(),
      profile_picture: z.lazy(() => SortOrderSchema).optional(),
      profile_cover_photo: z.lazy(() => SortOrderSchema).optional(),
      follows: z.lazy(() => SortOrderSchema).optional(),
      favorites: z.lazy(() => SortOrderSchema).optional(),
      reposts: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const challenge_profile_completionMaxOrderByAggregateInputObjectSchema =
  Schema;
