import { z } from 'zod';
import { IntFieldUpdateOperationsInputObjectSchema } from './IntFieldUpdateOperationsInput.schema';
import { NullableDateTimeFieldUpdateOperationsInputObjectSchema } from './NullableDateTimeFieldUpdateOperationsInput.schema';
import { StringFieldUpdateOperationsInputObjectSchema } from './StringFieldUpdateOperationsInput.schema';
import { chatUpdateOneRequiredWithoutChat_memberNestedInputObjectSchema } from './chatUpdateOneRequiredWithoutChat_memberNestedInput.schema';
import { chat_messageUpdateManyWithoutChat_memberNestedInputObjectSchema } from './chat_messageUpdateManyWithoutChat_memberNestedInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_memberUpdateInput> = z
  .object({
    user_id: z
      .union([
        z.number(),
        z.lazy(() => IntFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
    cleared_history_at: z
      .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputObjectSchema),
      ])
      .optional()
      .nullable(),
    invited_by_user_id: z
      .union([
        z.number(),
        z.lazy(() => IntFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
    invite_code: z
      .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
    last_active_at: z
      .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputObjectSchema),
      ])
      .optional()
      .nullable(),
    unread_count: z
      .union([
        z.number(),
        z.lazy(() => IntFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
    chat: z
      .lazy(
        () => chatUpdateOneRequiredWithoutChat_memberNestedInputObjectSchema,
      )
      .optional(),
    chat_message: z
      .lazy(
        () => chat_messageUpdateManyWithoutChat_memberNestedInputObjectSchema,
      )
      .optional(),
  })
  .strict();

export const chat_memberUpdateInputObjectSchema = Schema;
