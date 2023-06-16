import { z } from 'zod';
import { DateTimeWithAggregatesFilterObjectSchema } from './DateTimeWithAggregatesFilter.schema';
import { IntWithAggregatesFilterObjectSchema } from './IntWithAggregatesFilter.schema';
import { StringWithAggregatesFilterObjectSchema } from './StringWithAggregatesFilter.schema';
import { BoolWithAggregatesFilterObjectSchema } from './BoolWithAggregatesFilter.schema';
import { Enumdelist_track_reasonWithAggregatesFilterObjectSchema } from './Enumdelist_track_reasonWithAggregatesFilter.schema';
import { delist_track_reasonSchema } from '../enums/delist_track_reason.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.track_delist_statusesScalarWhereWithAggregatesInput> =
  z
    .object({
      AND: z
        .union([
          z.lazy(
            () =>
              track_delist_statusesScalarWhereWithAggregatesInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                track_delist_statusesScalarWhereWithAggregatesInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      OR: z
        .lazy(
          () => track_delist_statusesScalarWhereWithAggregatesInputObjectSchema,
        )
        .array()
        .optional(),
      NOT: z
        .union([
          z.lazy(
            () =>
              track_delist_statusesScalarWhereWithAggregatesInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                track_delist_statusesScalarWhereWithAggregatesInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      created_at: z
        .union([
          z.lazy(() => DateTimeWithAggregatesFilterObjectSchema),
          z.coerce.date(),
        ])
        .optional(),
      track_id: z
        .union([z.lazy(() => IntWithAggregatesFilterObjectSchema), z.number()])
        .optional(),
      owner_id: z
        .union([z.lazy(() => IntWithAggregatesFilterObjectSchema), z.number()])
        .optional(),
      track_cid: z
        .union([
          z.lazy(() => StringWithAggregatesFilterObjectSchema),
          z.string(),
        ])
        .optional(),
      delisted: z
        .union([
          z.lazy(() => BoolWithAggregatesFilterObjectSchema),
          z.boolean(),
        ])
        .optional(),
      reason: z
        .union([
          z.lazy(() => Enumdelist_track_reasonWithAggregatesFilterObjectSchema),
          z.lazy(() => delist_track_reasonSchema),
        ])
        .optional(),
    })
    .strict();

export const track_delist_statusesScalarWhereWithAggregatesInputObjectSchema =
  Schema;
