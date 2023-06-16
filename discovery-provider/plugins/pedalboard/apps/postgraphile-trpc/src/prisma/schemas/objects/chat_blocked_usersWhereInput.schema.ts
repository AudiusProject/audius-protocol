import { z } from 'zod';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_blocked_usersWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => chat_blocked_usersWhereInputObjectSchema),
        z.lazy(() => chat_blocked_usersWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => chat_blocked_usersWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => chat_blocked_usersWhereInputObjectSchema),
        z.lazy(() => chat_blocked_usersWhereInputObjectSchema).array(),
      ])
      .optional(),
    blocker_user_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    blockee_user_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    created_at: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
  })
  .strict();

export const chat_blocked_usersWhereInputObjectSchema = Schema;
