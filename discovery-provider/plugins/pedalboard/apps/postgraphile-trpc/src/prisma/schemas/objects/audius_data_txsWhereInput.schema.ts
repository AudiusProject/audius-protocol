import { z } from 'zod';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { IntFilterObjectSchema } from './IntFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.audius_data_txsWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => audius_data_txsWhereInputObjectSchema),
        z.lazy(() => audius_data_txsWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => audius_data_txsWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => audius_data_txsWhereInputObjectSchema),
        z.lazy(() => audius_data_txsWhereInputObjectSchema).array(),
      ])
      .optional(),
    signature: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    slot: z.union([z.lazy(() => IntFilterObjectSchema), z.number()]).optional(),
  })
  .strict();

export const audius_data_txsWhereInputObjectSchema = Schema;
