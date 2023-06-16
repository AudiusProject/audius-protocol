import { z } from 'zod';
import { chat_memberCreateWithoutChatInputObjectSchema } from './chat_memberCreateWithoutChatInput.schema';
import { chat_memberUncheckedCreateWithoutChatInputObjectSchema } from './chat_memberUncheckedCreateWithoutChatInput.schema';
import { chat_memberCreateOrConnectWithoutChatInputObjectSchema } from './chat_memberCreateOrConnectWithoutChatInput.schema';
import { chat_memberCreateManyChatInputEnvelopeObjectSchema } from './chat_memberCreateManyChatInputEnvelope.schema';
import { chat_memberWhereUniqueInputObjectSchema } from './chat_memberWhereUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_memberUncheckedCreateNestedManyWithoutChatInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => chat_memberCreateWithoutChatInputObjectSchema),
          z.lazy(() => chat_memberCreateWithoutChatInputObjectSchema).array(),
          z.lazy(() => chat_memberUncheckedCreateWithoutChatInputObjectSchema),
          z
            .lazy(() => chat_memberUncheckedCreateWithoutChatInputObjectSchema)
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(() => chat_memberCreateOrConnectWithoutChatInputObjectSchema),
          z
            .lazy(() => chat_memberCreateOrConnectWithoutChatInputObjectSchema)
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(() => chat_memberCreateManyChatInputEnvelopeObjectSchema)
        .optional(),
      connect: z
        .union([
          z.lazy(() => chat_memberWhereUniqueInputObjectSchema),
          z.lazy(() => chat_memberWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const chat_memberUncheckedCreateNestedManyWithoutChatInputObjectSchema =
  Schema;
