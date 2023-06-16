import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.NullableDateTimeFieldUpdateOperationsInput> = z
  .object({
    set: z.coerce.date().optional().nullable(),
  })
  .strict();

export const NullableDateTimeFieldUpdateOperationsInputObjectSchema = Schema;
