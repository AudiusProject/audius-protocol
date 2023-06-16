import { z } from 'zod';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { BoolFilterObjectSchema } from './BoolFilter.schema';
import { Enumdelist_track_reasonFilterObjectSchema } from './Enumdelist_track_reasonFilter.schema';
import { delist_track_reasonSchema } from '../enums/delist_track_reason.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.track_delist_statusesWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => track_delist_statusesWhereInputObjectSchema),
        z.lazy(() => track_delist_statusesWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => track_delist_statusesWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => track_delist_statusesWhereInputObjectSchema),
        z.lazy(() => track_delist_statusesWhereInputObjectSchema).array(),
      ])
      .optional(),
    created_at: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
    track_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    owner_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    track_cid: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    delisted: z
      .union([z.lazy(() => BoolFilterObjectSchema), z.boolean()])
      .optional(),
    reason: z
      .union([
        z.lazy(() => Enumdelist_track_reasonFilterObjectSchema),
        z.lazy(() => delist_track_reasonSchema),
      ])
      .optional(),
  })
  .strict();

export const track_delist_statusesWhereInputObjectSchema = Schema;
