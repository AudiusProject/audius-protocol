import { z } from 'zod';
import { chatCreateNestedOneWithoutChat_memberInputObjectSchema } from './chatCreateNestedOneWithoutChat_memberInput.schema';
import { chat_messageCreateNestedManyWithoutChat_memberInputObjectSchema } from './chat_messageCreateNestedManyWithoutChat_memberInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_memberCreateInput> = z
  .object({
    user_id: z.number(),
    cleared_history_at: z.coerce.date().optional().nullable(),
    invited_by_user_id: z.number(),
    invite_code: z.string(),
    last_active_at: z.coerce.date().optional().nullable(),
    unread_count: z.number().optional(),
    chat: z.lazy(() => chatCreateNestedOneWithoutChat_memberInputObjectSchema),
    chat_message: z
      .lazy(
        () => chat_messageCreateNestedManyWithoutChat_memberInputObjectSchema,
      )
      .optional(),
  })
  .strict();

export const chat_memberCreateInputObjectSchema = Schema;
