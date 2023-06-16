import { z } from 'zod';
import { chat_messageCreateWithoutChat_memberInputObjectSchema } from './chat_messageCreateWithoutChat_memberInput.schema';
import { chat_messageUncheckedCreateWithoutChat_memberInputObjectSchema } from './chat_messageUncheckedCreateWithoutChat_memberInput.schema';
import { chat_messageCreateOrConnectWithoutChat_memberInputObjectSchema } from './chat_messageCreateOrConnectWithoutChat_memberInput.schema';
import { chat_messageCreateManyChat_memberInputEnvelopeObjectSchema } from './chat_messageCreateManyChat_memberInputEnvelope.schema';
import { chat_messageWhereUniqueInputObjectSchema } from './chat_messageWhereUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_messageUncheckedCreateNestedManyWithoutChat_memberInput> =
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
      createMany: z
        .lazy(() => chat_messageCreateManyChat_memberInputEnvelopeObjectSchema)
        .optional(),
      connect: z
        .union([
          z.lazy(() => chat_messageWhereUniqueInputObjectSchema),
          z.lazy(() => chat_messageWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const chat_messageUncheckedCreateNestedManyWithoutChat_memberInputObjectSchema =
  Schema;
