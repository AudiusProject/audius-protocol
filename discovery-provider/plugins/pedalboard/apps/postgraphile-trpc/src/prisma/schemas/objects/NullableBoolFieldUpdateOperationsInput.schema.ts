import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.NullableBoolFieldUpdateOperationsInput> = z
  .object({
    set: z.boolean().optional().nullable(),
  })
  .strict();

export const NullableBoolFieldUpdateOperationsInputObjectSchema = Schema;
