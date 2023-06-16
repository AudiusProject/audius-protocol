import { z } from 'zod';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';
import { StringNullableFilterObjectSchema } from './StringNullableFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.reactionsWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => reactionsWhereInputObjectSchema),
        z.lazy(() => reactionsWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => reactionsWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => reactionsWhereInputObjectSchema),
        z.lazy(() => reactionsWhereInputObjectSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterObjectSchema), z.number()]).optional(),
    slot: z.union([z.lazy(() => IntFilterObjectSchema), z.number()]).optional(),
    reaction_value: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    sender_wallet: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    reaction_type: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    reacted_to: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    timestamp: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
    tx_signature: z
      .union([z.lazy(() => StringNullableFilterObjectSchema), z.string()])
      .optional()
      .nullable(),
  })
  .strict();

export const reactionsWhereInputObjectSchema = Schema;
