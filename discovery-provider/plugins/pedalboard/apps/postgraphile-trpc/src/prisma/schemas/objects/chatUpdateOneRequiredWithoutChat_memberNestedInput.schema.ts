import { z } from 'zod';
import { chatCreateWithoutChat_memberInputObjectSchema } from './chatCreateWithoutChat_memberInput.schema';
import { chatUncheckedCreateWithoutChat_memberInputObjectSchema } from './chatUncheckedCreateWithoutChat_memberInput.schema';
import { chatCreateOrConnectWithoutChat_memberInputObjectSchema } from './chatCreateOrConnectWithoutChat_memberInput.schema';
import { chatUpsertWithoutChat_memberInputObjectSchema } from './chatUpsertWithoutChat_memberInput.schema';
import { chatWhereUniqueInputObjectSchema } from './chatWhereUniqueInput.schema';
import { chatUpdateWithoutChat_memberInputObjectSchema } from './chatUpdateWithoutChat_memberInput.schema';
import { chatUncheckedUpdateWithoutChat_memberInputObjectSchema } from './chatUncheckedUpdateWithoutChat_memberInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chatUpdateOneRequiredWithoutChat_memberNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => chatCreateWithoutChat_memberInputObjectSchema),
          z.lazy(() => chatUncheckedCreateWithoutChat_memberInputObjectSchema),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => chatCreateOrConnectWithoutChat_memberInputObjectSchema)
        .optional(),
      upsert: z
        .lazy(() => chatUpsertWithoutChat_memberInputObjectSchema)
        .optional(),
      connect: z.lazy(() => chatWhereUniqueInputObjectSchema).optional(),
      update: z
        .union([
          z.lazy(() => chatUpdateWithoutChat_memberInputObjectSchema),
          z.lazy(() => chatUncheckedUpdateWithoutChat_memberInputObjectSchema),
        ])
        .optional(),
    })
    .strict();

export const chatUpdateOneRequiredWithoutChat_memberNestedInputObjectSchema =
  Schema;
