import { z } from 'zod';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { DateTimeNullableFilterObjectSchema } from './DateTimeNullableFilter.schema';
import { ChatRelationFilterObjectSchema } from './ChatRelationFilter.schema';
import { chatWhereInputObjectSchema } from './chatWhereInput.schema';
import { Chat_messageListRelationFilterObjectSchema } from './Chat_messageListRelationFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_memberWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => chat_memberWhereInputObjectSchema),
        z.lazy(() => chat_memberWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => chat_memberWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => chat_memberWhereInputObjectSchema),
        z.lazy(() => chat_memberWhereInputObjectSchema).array(),
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
    chat: z
      .union([
        z.lazy(() => ChatRelationFilterObjectSchema),
        z.lazy(() => chatWhereInputObjectSchema),
      ])
      .optional(),
    chat_message: z
      .lazy(() => Chat_messageListRelationFilterObjectSchema)
      .optional(),
  })
  .strict();

export const chat_memberWhereInputObjectSchema = Schema;
