import { z } from 'zod';
import { chatCreateWithoutChat_memberInputObjectSchema } from './chatCreateWithoutChat_memberInput.schema';
import { chatUncheckedCreateWithoutChat_memberInputObjectSchema } from './chatUncheckedCreateWithoutChat_memberInput.schema';
import { chatCreateOrConnectWithoutChat_memberInputObjectSchema } from './chatCreateOrConnectWithoutChat_memberInput.schema';
import { chatWhereUniqueInputObjectSchema } from './chatWhereUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chatCreateNestedOneWithoutChat_memberInput> = z
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
    connect: z.lazy(() => chatWhereUniqueInputObjectSchema).optional(),
  })
  .strict();

export const chatCreateNestedOneWithoutChat_memberInputObjectSchema = Schema;
