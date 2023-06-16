import { z } from 'zod';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { BoolFilterObjectSchema } from './BoolFilter.schema';
import { Enumdelist_user_reasonFilterObjectSchema } from './Enumdelist_user_reasonFilter.schema';
import { delist_user_reasonSchema } from '../enums/delist_user_reason.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_delist_statusesWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => user_delist_statusesWhereInputObjectSchema),
        z.lazy(() => user_delist_statusesWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => user_delist_statusesWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => user_delist_statusesWhereInputObjectSchema),
        z.lazy(() => user_delist_statusesWhereInputObjectSchema).array(),
      ])
      .optional(),
    created_at: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
    user_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    delisted: z
      .union([z.lazy(() => BoolFilterObjectSchema), z.boolean()])
      .optional(),
    reason: z
      .union([
        z.lazy(() => Enumdelist_user_reasonFilterObjectSchema),
        z.lazy(() => delist_user_reasonSchema),
      ])
      .optional(),
  })
  .strict();

export const user_delist_statusesWhereInputObjectSchema = Schema;
