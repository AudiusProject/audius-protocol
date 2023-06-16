import { z } from 'zod';
import { chatCreateNestedOneWithoutChat_memberInputObjectSchema } from './chatCreateNestedOneWithoutChat_memberInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_memberCreateWithoutChat_messageInput> = z
  .object({
    user_id: z.number(),
    cleared_history_at: z.coerce.date().optional().nullable(),
    invited_by_user_id: z.number(),
    invite_code: z.string(),
    last_active_at: z.coerce.date().optional().nullable(),
    unread_count: z.number().optional(),
    chat: z.lazy(() => chatCreateNestedOneWithoutChat_memberInputObjectSchema),
  })
  .strict();

export const chat_memberCreateWithoutChat_messageInputObjectSchema = Schema;
