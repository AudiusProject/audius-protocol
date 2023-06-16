import { z } from 'zod';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { DateTimeNullableFilterObjectSchema } from './DateTimeNullableFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.challenge_listen_streakWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => challenge_listen_streakWhereInputObjectSchema),
        z.lazy(() => challenge_listen_streakWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => challenge_listen_streakWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => challenge_listen_streakWhereInputObjectSchema),
        z.lazy(() => challenge_listen_streakWhereInputObjectSchema).array(),
      ])
      .optional(),
    user_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    last_listen_date: z
      .union([
        z.lazy(() => DateTimeNullableFilterObjectSchema),
        z.coerce.date(),
      ])
      .optional()
      .nullable(),
    listen_streak: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
  })
  .strict();

export const challenge_listen_streakWhereInputObjectSchema = Schema;
