import { z } from 'zod';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';
import { StringNullableFilterObjectSchema } from './StringNullableFilter.schema';
import { Chat_memberListRelationFilterObjectSchema } from './Chat_memberListRelationFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chatWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => chatWhereInputObjectSchema),
        z.lazy(() => chatWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => chatWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => chatWhereInputObjectSchema),
        z.lazy(() => chatWhereInputObjectSchema).array(),
      ])
      .optional(),
    chat_id: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    created_at: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
    last_message_at: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
    last_message: z
      .union([z.lazy(() => StringNullableFilterObjectSchema), z.string()])
      .optional()
      .nullable(),
    chat_member: z
      .lazy(() => Chat_memberListRelationFilterObjectSchema)
      .optional(),
  })
  .strict();

export const chatWhereInputObjectSchema = Schema;
