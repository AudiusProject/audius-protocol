import { z } from 'zod';
import { StringFieldUpdateOperationsInputObjectSchema } from './StringFieldUpdateOperationsInput.schema';
import { delist_entitySchema } from '../enums/delist_entity.schema';
import { Enumdelist_entityFieldUpdateOperationsInputObjectSchema } from './Enumdelist_entityFieldUpdateOperationsInput.schema';
import { DateTimeFieldUpdateOperationsInputObjectSchema } from './DateTimeFieldUpdateOperationsInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.delist_status_cursorUncheckedUpdateInput> = z
  .object({
    host: z
      .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
    entity: z
      .union([
        z.lazy(() => delist_entitySchema),
        z.lazy(() => Enumdelist_entityFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
    created_at: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
  })
  .strict();

export const delist_status_cursorUncheckedUpdateInputObjectSchema = Schema;
