import { z } from 'zod';
import { chat_message_reactionsScalarWhereInputObjectSchema } from './chat_message_reactionsScalarWhereInput.schema';
import { chat_message_reactionsUpdateManyMutationInputObjectSchema } from './chat_message_reactionsUpdateManyMutationInput.schema';
import { chat_message_reactionsUncheckedUpdateManyWithoutChat_message_reactionsInputObjectSchema } from './chat_message_reactionsUncheckedUpdateManyWithoutChat_message_reactionsInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_message_reactionsUpdateManyWithWhereWithoutChat_messageInput> =
  z
    .object({
      where: z.lazy(() => chat_message_reactionsScalarWhereInputObjectSchema),
      data: z.union([
        z.lazy(() => chat_message_reactionsUpdateManyMutationInputObjectSchema),
        z.lazy(
          () =>
            chat_message_reactionsUncheckedUpdateManyWithoutChat_message_reactionsInputObjectSchema,
        ),
      ]),
    })
    .strict();

export const chat_message_reactionsUpdateManyWithWhereWithoutChat_messageInputObjectSchema =
  Schema;
