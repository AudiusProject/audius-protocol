import { z } from 'zod';
import { chat_messageCreateWithoutChat_memberInputObjectSchema } from './chat_messageCreateWithoutChat_memberInput.schema';
import { chat_messageUncheckedCreateWithoutChat_memberInputObjectSchema } from './chat_messageUncheckedCreateWithoutChat_memberInput.schema';
import { chat_messageCreateOrConnectWithoutChat_memberInputObjectSchema } from './chat_messageCreateOrConnectWithoutChat_memberInput.schema';
import { chat_messageUpsertWithWhereUniqueWithoutChat_memberInputObjectSchema } from './chat_messageUpsertWithWhereUniqueWithoutChat_memberInput.schema';
import { chat_messageCreateManyChat_memberInputEnvelopeObjectSchema } from './chat_messageCreateManyChat_memberInputEnvelope.schema';
import { chat_messageWhereUniqueInputObjectSchema } from './chat_messageWhereUniqueInput.schema';
import { chat_messageUpdateWithWhereUniqueWithoutChat_memberInputObjectSchema } from './chat_messageUpdateWithWhereUniqueWithoutChat_memberInput.schema';
import { chat_messageUpdateManyWithWhereWithoutChat_memberInputObjectSchema } from './chat_messageUpdateManyWithWhereWithoutChat_memberInput.schema';
import { chat_messageScalarWhereInputObjectSchema } from './chat_messageScalarWhereInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_messageUncheckedUpdateManyWithoutChat_memberNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => chat_messageCreateWithoutChat_memberInputObjectSchema),
          z
            .lazy(() => chat_messageCreateWithoutChat_memberInputObjectSchema)
            .array(),
          z.lazy(
            () =>
              chat_messageUncheckedCreateWithoutChat_memberInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                chat_messageUncheckedCreateWithoutChat_memberInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () =>
              chat_messageCreateOrConnectWithoutChat_memberInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                chat_messageCreateOrConnectWithoutChat_memberInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      upsert: z
        .union([
          z.lazy(
            () =>
              chat_messageUpsertWithWhereUniqueWithoutChat_memberInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                chat_messageUpsertWithWhereUniqueWithoutChat_memberInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(() => chat_messageCreateManyChat_memberInputEnvelopeObjectSchema)
        .optional(),
      set: z
        .union([
          z.lazy(() => chat_messageWhereUniqueInputObjectSchema),
          z.lazy(() => chat_messageWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      disconnect: z
        .union([
          z.lazy(() => chat_messageWhereUniqueInputObjectSchema),
          z.lazy(() => chat_messageWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      delete: z
        .union([
          z.lazy(() => chat_messageWhereUniqueInputObjectSchema),
          z.lazy(() => chat_messageWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      connect: z
        .union([
          z.lazy(() => chat_messageWhereUniqueInputObjectSchema),
          z.lazy(() => chat_messageWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      update: z
        .union([
          z.lazy(
            () =>
              chat_messageUpdateWithWhereUniqueWithoutChat_memberInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                chat_messageUpdateWithWhereUniqueWithoutChat_memberInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(
            () =>
              chat_messageUpdateManyWithWhereWithoutChat_memberInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                chat_messageUpdateManyWithWhereWithoutChat_memberInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      deleteMany: z
        .union([
          z.lazy(() => chat_messageScalarWhereInputObjectSchema),
          z.lazy(() => chat_messageScalarWhereInputObjectSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const chat_messageUncheckedUpdateManyWithoutChat_memberNestedInputObjectSchema =
  Schema;
