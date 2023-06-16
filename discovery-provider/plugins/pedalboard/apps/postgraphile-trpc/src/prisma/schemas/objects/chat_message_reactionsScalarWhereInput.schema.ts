import { z } from 'zod';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_message_reactionsScalarWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => chat_message_reactionsScalarWhereInputObjectSchema),
        z
          .lazy(() => chat_message_reactionsScalarWhereInputObjectSchema)
          .array(),
      ])
      .optional(),
    OR: z
      .lazy(() => chat_message_reactionsScalarWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => chat_message_reactionsScalarWhereInputObjectSchema),
        z
          .lazy(() => chat_message_reactionsScalarWhereInputObjectSchema)
          .array(),
      ])
      .optional(),
    user_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    message_id: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    reaction: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    created_at: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
    updated_at: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
  })
  .strict();

export const chat_message_reactionsScalarWhereInputObjectSchema = Schema;
