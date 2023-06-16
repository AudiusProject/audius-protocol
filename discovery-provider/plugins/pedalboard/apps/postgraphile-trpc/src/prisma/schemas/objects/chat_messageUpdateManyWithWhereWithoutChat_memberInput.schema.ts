import { z } from 'zod';
import { chat_messageScalarWhereInputObjectSchema } from './chat_messageScalarWhereInput.schema';
import { chat_messageUpdateManyMutationInputObjectSchema } from './chat_messageUpdateManyMutationInput.schema';
import { chat_messageUncheckedUpdateManyWithoutChat_messageInputObjectSchema } from './chat_messageUncheckedUpdateManyWithoutChat_messageInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_messageUpdateManyWithWhereWithoutChat_memberInput> =
  z
    .object({
      where: z.lazy(() => chat_messageScalarWhereInputObjectSchema),
      data: z.union([
        z.lazy(() => chat_messageUpdateManyMutationInputObjectSchema),
        z.lazy(
          () =>
            chat_messageUncheckedUpdateManyWithoutChat_messageInputObjectSchema,
        ),
      ]),
    })
    .strict();

export const chat_messageUpdateManyWithWhereWithoutChat_memberInputObjectSchema =
  Schema;
