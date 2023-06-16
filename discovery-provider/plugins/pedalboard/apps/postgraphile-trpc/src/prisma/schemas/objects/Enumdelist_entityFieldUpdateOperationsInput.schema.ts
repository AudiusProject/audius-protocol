import { z } from 'zod';
import { delist_entitySchema } from '../enums/delist_entity.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Enumdelist_entityFieldUpdateOperationsInput> = z
  .object({
    set: z.lazy(() => delist_entitySchema).optional(),
  })
  .strict();

export const Enumdelist_entityFieldUpdateOperationsInputObjectSchema = Schema;
