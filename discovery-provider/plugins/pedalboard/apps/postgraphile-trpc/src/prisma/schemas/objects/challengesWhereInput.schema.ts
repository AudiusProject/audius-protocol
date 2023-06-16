import { z } from 'zod';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { EnumchallengetypeFilterObjectSchema } from './EnumchallengetypeFilter.schema';
import { challengetypeSchema } from '../enums/challengetype.schema';
import { BoolFilterObjectSchema } from './BoolFilter.schema';
import { IntNullableFilterObjectSchema } from './IntNullableFilter.schema';
import { User_challengesListRelationFilterObjectSchema } from './User_challengesListRelationFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.challengesWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => challengesWhereInputObjectSchema),
        z.lazy(() => challengesWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => challengesWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => challengesWhereInputObjectSchema),
        z.lazy(() => challengesWhereInputObjectSchema).array(),
      ])
      .optional(),
    id: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    type: z
      .union([
        z.lazy(() => EnumchallengetypeFilterObjectSchema),
        z.lazy(() => challengetypeSchema),
      ])
      .optional(),
    amount: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    active: z
      .union([z.lazy(() => BoolFilterObjectSchema), z.boolean()])
      .optional(),
    step_count: z
      .union([z.lazy(() => IntNullableFilterObjectSchema), z.number()])
      .optional()
      .nullable(),
    starting_block: z
      .union([z.lazy(() => IntNullableFilterObjectSchema), z.number()])
      .optional()
      .nullable(),
    user_challenges: z
      .lazy(() => User_challengesListRelationFilterObjectSchema)
      .optional(),
  })
  .strict();

export const challengesWhereInputObjectSchema = Schema;
