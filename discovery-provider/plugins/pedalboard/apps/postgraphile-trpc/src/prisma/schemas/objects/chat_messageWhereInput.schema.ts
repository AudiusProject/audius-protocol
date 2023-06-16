import { z } from 'zod';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';
import { Chat_memberRelationFilterObjectSchema } from './Chat_memberRelationFilter.schema';
import { chat_memberWhereInputObjectSchema } from './chat_memberWhereInput.schema';
import { Chat_message_reactionsListRelationFilterObjectSchema } from './Chat_message_reactionsListRelationFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_messageWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => chat_messageWhereInputObjectSchema),
        z.lazy(() => chat_messageWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => chat_messageWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => chat_messageWhereInputObjectSchema),
        z.lazy(() => chat_messageWhereInputObjectSchema).array(),
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
    chat_member: z
      .union([
        z.lazy(() => Chat_memberRelationFilterObjectSchema),
        z.lazy(() => chat_memberWhereInputObjectSchema),
      ])
      .optional(),
    chat_message_reactions: z
      .lazy(() => Chat_message_reactionsListRelationFilterObjectSchema)
      .optional(),
  })
  .strict();

export const chat_messageWhereInputObjectSchema = Schema;
