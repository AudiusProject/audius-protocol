import { z } from 'zod';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_messageScalarWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => chat_messageScalarWhereInputObjectSchema),
        z.lazy(() => chat_messageScalarWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => chat_messageScalarWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => chat_messageScalarWhereInputObjectSchema),
        z.lazy(() => chat_messageScalarWhereInputObjectSchema).array(),
      ])
      .optional(),
    message_id: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    chat_id: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    user_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    created_at: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
    ciphertext: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
  })
  .strict();

export const chat_messageScalarWhereInputObjectSchema = Schema;
