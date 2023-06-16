import { z } from 'zod';
import { delist_user_reasonSchema } from '../enums/delist_user_reason.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Enumdelist_user_reasonFieldUpdateOperationsInput> =
  z
    .object({
      set: z.lazy(() => delist_user_reasonSchema).optional(),
    })
    .strict();

export const Enumdelist_user_reasonFieldUpdateOperationsInputObjectSchema =
  Schema;
