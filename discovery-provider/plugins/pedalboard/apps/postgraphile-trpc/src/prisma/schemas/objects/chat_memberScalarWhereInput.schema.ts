import { z } from 'zod';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { DateTimeNullableFilterObjectSchema } from './DateTimeNullableFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_memberScalarWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => chat_memberScalarWhereInputObjectSchema),
        z.lazy(() => chat_memberScalarWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => chat_memberScalarWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => chat_memberScalarWhereInputObjectSchema),
        z.lazy(() => chat_memberScalarWhereInputObjectSchema).array(),
      ])
      .optional(),
    chat_id: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    user_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    cleared_history_at: z
      .union([
        z.lazy(() => DateTimeNullableFilterObjectSchema),
        z.coerce.date(),
      ])
      .optional()
      .nullable(),
    invited_by_user_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    invite_code: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    last_active_at: z
      .union([
        z.lazy(() => DateTimeNullableFilterObjectSchema),
        z.coerce.date(),
      ])
      .optional()
      .nullable(),
    unread_count: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
  })
  .strict();

export const chat_memberScalarWhereInputObjectSchema = Schema;
