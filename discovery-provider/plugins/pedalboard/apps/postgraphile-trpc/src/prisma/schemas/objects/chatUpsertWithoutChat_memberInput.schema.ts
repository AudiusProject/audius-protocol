import { z } from 'zod';
import { chatUpdateWithoutChat_memberInputObjectSchema } from './chatUpdateWithoutChat_memberInput.schema';
import { chatUncheckedUpdateWithoutChat_memberInputObjectSchema } from './chatUncheckedUpdateWithoutChat_memberInput.schema';
import { chatCreateWithoutChat_memberInputObjectSchema } from './chatCreateWithoutChat_memberInput.schema';
import { chatUncheckedCreateWithoutChat_memberInputObjectSchema } from './chatUncheckedCreateWithoutChat_memberInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chatUpsertWithoutChat_memberInput> = z
  .object({
    update: z.union([
      z.lazy(() => chatUpdateWithoutChat_memberInputObjectSchema),
      z.lazy(() => chatUncheckedUpdateWithoutChat_memberInputObjectSchema),
    ]),
    create: z.union([
      z.lazy(() => chatCreateWithoutChat_memberInputObjectSchema),
      z.lazy(() => chatUncheckedCreateWithoutChat_memberInputObjectSchema),
    ]),
  })
  .strict();

export const chatUpsertWithoutChat_memberInputObjectSchema = Schema;
