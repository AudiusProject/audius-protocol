import { z } from 'zod';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { Enumdelist_entityFilterObjectSchema } from './Enumdelist_entityFilter.schema';
import { delist_entitySchema } from '../enums/delist_entity.schema';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.delist_status_cursorWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => delist_status_cursorWhereInputObjectSchema),
        z.lazy(() => delist_status_cursorWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => delist_status_cursorWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => delist_status_cursorWhereInputObjectSchema),
        z.lazy(() => delist_status_cursorWhereInputObjectSchema).array(),
      ])
      .optional(),
    host: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    entity: z
      .union([
        z.lazy(() => Enumdelist_entityFilterObjectSchema),
        z.lazy(() => delist_entitySchema),
      ])
      .optional(),
    created_at: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
  })
  .strict();

export const delist_status_cursorWhereInputObjectSchema = Schema;
