import { z } from 'zod';
import { chat_memberCreateWithoutChatInputObjectSchema } from './chat_memberCreateWithoutChatInput.schema';
import { chat_memberUncheckedCreateWithoutChatInputObjectSchema } from './chat_memberUncheckedCreateWithoutChatInput.schema';
import { chat_memberCreateOrConnectWithoutChatInputObjectSchema } from './chat_memberCreateOrConnectWithoutChatInput.schema';
import { chat_memberUpsertWithWhereUniqueWithoutChatInputObjectSchema } from './chat_memberUpsertWithWhereUniqueWithoutChatInput.schema';
import { chat_memberCreateManyChatInputEnvelopeObjectSchema } from './chat_memberCreateManyChatInputEnvelope.schema';
import { chat_memberWhereUniqueInputObjectSchema } from './chat_memberWhereUniqueInput.schema';
import { chat_memberUpdateWithWhereUniqueWithoutChatInputObjectSchema } from './chat_memberUpdateWithWhereUniqueWithoutChatInput.schema';
import { chat_memberUpdateManyWithWhereWithoutChatInputObjectSchema } from './chat_memberUpdateManyWithWhereWithoutChatInput.schema';
import { chat_memberScalarWhereInputObjectSchema } from './chat_memberScalarWhereInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_memberUpdateManyWithoutChatNestedInput> = z
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
    upsert: z
      .union([
        z.lazy(
          () => chat_memberUpsertWithWhereUniqueWithoutChatInputObjectSchema,
        ),
        z
          .lazy(
            () => chat_memberUpsertWithWhereUniqueWithoutChatInputObjectSchema,
          )
          .array(),
      ])
      .optional(),
    createMany: z
      .lazy(() => chat_memberCreateManyChatInputEnvelopeObjectSchema)
      .optional(),
    set: z
      .union([
        z.lazy(() => chat_memberWhereUniqueInputObjectSchema),
        z.lazy(() => chat_memberWhereUniqueInputObjectSchema).array(),
      ])
      .optional(),
    disconnect: z
      .union([
        z.lazy(() => chat_memberWhereUniqueInputObjectSchema),
        z.lazy(() => chat_memberWhereUniqueInputObjectSchema).array(),
      ])
      .optional(),
    delete: z
      .union([
        z.lazy(() => chat_memberWhereUniqueInputObjectSchema),
        z.lazy(() => chat_memberWhereUniqueInputObjectSchema).array(),
      ])
      .optional(),
    connect: z
      .union([
        z.lazy(() => chat_memberWhereUniqueInputObjectSchema),
        z.lazy(() => chat_memberWhereUniqueInputObjectSchema).array(),
      ])
      .optional(),
    update: z
      .union([
        z.lazy(
          () => chat_memberUpdateWithWhereUniqueWithoutChatInputObjectSchema,
        ),
        z
          .lazy(
            () => chat_memberUpdateWithWhereUniqueWithoutChatInputObjectSchema,
          )
          .array(),
      ])
      .optional(),
    updateMany: z
      .union([
        z.lazy(
          () => chat_memberUpdateManyWithWhereWithoutChatInputObjectSchema,
        ),
        z
          .lazy(
            () => chat_memberUpdateManyWithWhereWithoutChatInputObjectSchema,
          )
          .array(),
      ])
      .optional(),
    deleteMany: z
      .union([
        z.lazy(() => chat_memberScalarWhereInputObjectSchema),
        z.lazy(() => chat_memberScalarWhereInputObjectSchema).array(),
      ])
      .optional(),
  })
  .strict();

export const chat_memberUpdateManyWithoutChatNestedInputObjectSchema = Schema;
