import { z } from 'zod';
import { DateTimeFieldUpdateOperationsInputObjectSchema } from './DateTimeFieldUpdateOperationsInput.schema';
import { IntFieldUpdateOperationsInputObjectSchema } from './IntFieldUpdateOperationsInput.schema';
import { BoolFieldUpdateOperationsInputObjectSchema } from './BoolFieldUpdateOperationsInput.schema';
import { delist_user_reasonSchema } from '../enums/delist_user_reason.schema';
import { Enumdelist_user_reasonFieldUpdateOperationsInputObjectSchema } from './Enumdelist_user_reasonFieldUpdateOperationsInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_delist_statusesUncheckedUpdateManyInput> = z
  .object({
    created_at: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
    user_id: z
      .union([
        z.number(),
        z.lazy(() => IntFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
    delisted: z
      .union([
        z.boolean(),
        z.lazy(() => BoolFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
    reason: z
      .union([
        z.lazy(() => delist_user_reasonSchema),
        z.lazy(
          () => Enumdelist_user_reasonFieldUpdateOperationsInputObjectSchema,
        ),
      ])
      .optional(),
  })
  .strict();

export const user_delist_statusesUncheckedUpdateManyInputObjectSchema = Schema;
