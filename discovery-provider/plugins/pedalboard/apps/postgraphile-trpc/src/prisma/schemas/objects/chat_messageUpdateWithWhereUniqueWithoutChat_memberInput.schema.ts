import { z } from 'zod';
import { chat_messageWhereUniqueInputObjectSchema } from './chat_messageWhereUniqueInput.schema';
import { chat_messageUpdateWithoutChat_memberInputObjectSchema } from './chat_messageUpdateWithoutChat_memberInput.schema';
import { chat_messageUncheckedUpdateWithoutChat_memberInputObjectSchema } from './chat_messageUncheckedUpdateWithoutChat_memberInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_messageUpdateWithWhereUniqueWithoutChat_memberInput> =
  z
    .object({
      where: z.lazy(() => chat_messageWhereUniqueInputObjectSchema),
      data: z.union([
        z.lazy(() => chat_messageUpdateWithoutChat_memberInputObjectSchema),
        z.lazy(
          () => chat_messageUncheckedUpdateWithoutChat_memberInputObjectSchema,
        ),
      ]),
    })
    .strict();

export const chat_messageUpdateWithWhereUniqueWithoutChat_memberInputObjectSchema =
  Schema;
