import { z } from 'zod';
import { chat_message_reactionsCreateManyChat_messageInputObjectSchema } from './chat_message_reactionsCreateManyChat_messageInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_message_reactionsCreateManyChat_messageInputEnvelope> =
  z
    .object({
      data: z.union([
        z.lazy(
          () => chat_message_reactionsCreateManyChat_messageInputObjectSchema,
        ),
        z
          .lazy(
            () => chat_message_reactionsCreateManyChat_messageInputObjectSchema,
          )
          .array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const chat_message_reactionsCreateManyChat_messageInputEnvelopeObjectSchema =
  Schema;
