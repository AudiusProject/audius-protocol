import { z } from 'zod';
import { chat_memberScalarWhereInputObjectSchema } from './chat_memberScalarWhereInput.schema';
import { chat_memberUpdateManyMutationInputObjectSchema } from './chat_memberUpdateManyMutationInput.schema';
import { chat_memberUncheckedUpdateManyWithoutChat_memberInputObjectSchema } from './chat_memberUncheckedUpdateManyWithoutChat_memberInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_memberUpdateManyWithWhereWithoutChatInput> =
  z
    .object({
      where: z.lazy(() => chat_memberScalarWhereInputObjectSchema),
      data: z.union([
        z.lazy(() => chat_memberUpdateManyMutationInputObjectSchema),
        z.lazy(
          () =>
            chat_memberUncheckedUpdateManyWithoutChat_memberInputObjectSchema,
        ),
      ]),
    })
    .strict();

export const chat_memberUpdateManyWithWhereWithoutChatInputObjectSchema =
  Schema;
