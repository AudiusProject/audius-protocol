import { z } from 'zod';
import { challengetypeSchema } from '../enums/challengetype.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.EnumchallengetypeFieldUpdateOperationsInput> = z
  .object({
    set: z.lazy(() => challengetypeSchema).optional(),
  })
  .strict();

export const EnumchallengetypeFieldUpdateOperationsInputObjectSchema = Schema;
