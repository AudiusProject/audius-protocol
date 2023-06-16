import { z } from 'zod';
import { savetypeSchema } from '../enums/savetype.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.EnumsavetypeFieldUpdateOperationsInput> = z
  .object({
    set: z.lazy(() => savetypeSchema).optional(),
  })
  .strict();

export const EnumsavetypeFieldUpdateOperationsInputObjectSchema = Schema;
