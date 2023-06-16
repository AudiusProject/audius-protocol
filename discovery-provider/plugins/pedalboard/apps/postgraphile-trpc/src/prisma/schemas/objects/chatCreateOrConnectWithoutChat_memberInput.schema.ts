import { z } from 'zod';
import { chatWhereUniqueInputObjectSchema } from './chatWhereUniqueInput.schema';
import { chatCreateWithoutChat_memberInputObjectSchema } from './chatCreateWithoutChat_memberInput.schema';
import { chatUncheckedCreateWithoutChat_memberInputObjectSchema } from './chatUncheckedCreateWithoutChat_memberInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chatCreateOrConnectWithoutChat_memberInput> = z
  .object({
    where: z.lazy(() => chatWhereUniqueInputObjectSchema),
    create: z.union([
      z.lazy(() => chatCreateWithoutChat_memberInputObjectSchema),
      z.lazy(() => chatUncheckedCreateWithoutChat_memberInputObjectSchema),
    ]),
  })
  .strict();

export const chatCreateOrConnectWithoutChat_memberInputObjectSchema = Schema;
