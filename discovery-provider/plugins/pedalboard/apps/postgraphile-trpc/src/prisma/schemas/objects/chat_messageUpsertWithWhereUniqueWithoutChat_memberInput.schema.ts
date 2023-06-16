import { z } from 'zod';
import { chat_messageWhereUniqueInputObjectSchema } from './chat_messageWhereUniqueInput.schema';
import { chat_messageUpdateWithoutChat_memberInputObjectSchema } from './chat_messageUpdateWithoutChat_memberInput.schema';
import { chat_messageUncheckedUpdateWithoutChat_memberInputObjectSchema } from './chat_messageUncheckedUpdateWithoutChat_memberInput.schema';
import { chat_messageCreateWithoutChat_memberInputObjectSchema } from './chat_messageCreateWithoutChat_memberInput.schema';
import { chat_messageUncheckedCreateWithoutChat_memberInputObjectSchema } from './chat_messageUncheckedCreateWithoutChat_memberInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_messageUpsertWithWhereUniqueWithoutChat_memberInput> =
  z
    .object({
      where: z.lazy(() => chat_messageWhereUniqueInputObjectSchema),
      update: z.union([
        z.lazy(() => chat_messageUpdateWithoutChat_memberInputObjectSchema),
        z.lazy(
          () => chat_messageUncheckedUpdateWithoutChat_memberInputObjectSchema,
        ),
      ]),
      create: z.union([
        z.lazy(() => chat_messageCreateWithoutChat_memberInputObjectSchema),
        z.lazy(
          () => chat_messageUncheckedCreateWithoutChat_memberInputObjectSchema,
        ),
      ]),
    })
    .strict();

export const chat_messageUpsertWithWhereUniqueWithoutChat_memberInputObjectSchema =
  Schema;
