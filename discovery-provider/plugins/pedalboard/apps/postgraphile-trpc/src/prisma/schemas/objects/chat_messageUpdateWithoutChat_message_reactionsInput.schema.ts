import { z } from 'zod';
import { StringFieldUpdateOperationsInputObjectSchema } from './StringFieldUpdateOperationsInput.schema';
import { DateTimeFieldUpdateOperationsInputObjectSchema } from './DateTimeFieldUpdateOperationsInput.schema';
import { chat_memberUpdateOneRequiredWithoutChat_messageNestedInputObjectSchema } from './chat_memberUpdateOneRequiredWithoutChat_messageNestedInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_messageUpdateWithoutChat_message_reactionsInput> =
  z
    .object({
      message_id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputObjectSchema),
        ])
        .optional(),
      created_at: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputObjectSchema),
        ])
        .optional(),
      ciphertext: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputObjectSchema),
        ])
        .optional(),
      chat_member: z
        .lazy(
          () =>
            chat_memberUpdateOneRequiredWithoutChat_messageNestedInputObjectSchema,
        )
        .optional(),
    })
    .strict();

export const chat_messageUpdateWithoutChat_message_reactionsInputObjectSchema =
  Schema;
