import { z } from 'zod';
import { StringFieldUpdateOperationsInputObjectSchema } from './StringFieldUpdateOperationsInput.schema';
import { DateTimeFieldUpdateOperationsInputObjectSchema } from './DateTimeFieldUpdateOperationsInput.schema';
import { chat_message_reactionsUncheckedUpdateManyWithoutChat_messageNestedInputObjectSchema } from './chat_message_reactionsUncheckedUpdateManyWithoutChat_messageNestedInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_messageUncheckedUpdateWithoutChat_memberInput> =
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
      chat_message_reactions: z
        .lazy(
          () =>
            chat_message_reactionsUncheckedUpdateManyWithoutChat_messageNestedInputObjectSchema,
        )
        .optional(),
    })
    .strict();

export const chat_messageUncheckedUpdateWithoutChat_memberInputObjectSchema =
  Schema;
