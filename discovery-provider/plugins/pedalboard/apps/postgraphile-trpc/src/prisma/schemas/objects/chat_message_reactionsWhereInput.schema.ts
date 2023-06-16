import { z } from 'zod';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';
import { Chat_messageRelationFilterObjectSchema } from './Chat_messageRelationFilter.schema';
import { chat_messageWhereInputObjectSchema } from './chat_messageWhereInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_message_reactionsWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => chat_message_reactionsWhereInputObjectSchema),
        z.lazy(() => chat_message_reactionsWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => chat_message_reactionsWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => chat_message_reactionsWhereInputObjectSchema),
        z.lazy(() => chat_message_reactionsWhereInputObjectSchema).array(),
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
    chat_message: z
      .union([
        z.lazy(() => Chat_messageRelationFilterObjectSchema),
        z.lazy(() => chat_messageWhereInputObjectSchema),
      ])
      .optional(),
  })
  .strict();

export const chat_message_reactionsWhereInputObjectSchema = Schema;
