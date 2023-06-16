import { z } from 'zod';
import { skippedtransactionlevelSchema } from '../enums/skippedtransactionlevel.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.NullableEnumskippedtransactionlevelFieldUpdateOperationsInput> =
  z
    .object({
      set: z
        .lazy(() => skippedtransactionlevelSchema)
        .optional()
        .nullable(),
    })
    .strict();

export const NullableEnumskippedtransactionlevelFieldUpdateOperationsInputObjectSchema =
  Schema;
