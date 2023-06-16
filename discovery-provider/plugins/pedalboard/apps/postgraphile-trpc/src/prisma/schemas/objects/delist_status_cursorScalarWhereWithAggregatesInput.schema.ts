import { z } from 'zod';
import { StringWithAggregatesFilterObjectSchema } from './StringWithAggregatesFilter.schema';
import { Enumdelist_entityWithAggregatesFilterObjectSchema } from './Enumdelist_entityWithAggregatesFilter.schema';
import { delist_entitySchema } from '../enums/delist_entity.schema';
import { DateTimeWithAggregatesFilterObjectSchema } from './DateTimeWithAggregatesFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.delist_status_cursorScalarWhereWithAggregatesInput> =
  z
    .object({
      AND: z
        .union([
          z.lazy(
            () =>
              delist_status_cursorScalarWhereWithAggregatesInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                delist_status_cursorScalarWhereWithAggregatesInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      OR: z
        .lazy(
          () => delist_status_cursorScalarWhereWithAggregatesInputObjectSchema,
        )
        .array()
        .optional(),
      NOT: z
        .union([
          z.lazy(
            () =>
              delist_status_cursorScalarWhereWithAggregatesInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                delist_status_cursorScalarWhereWithAggregatesInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      host: z
        .union([
          z.lazy(() => StringWithAggregatesFilterObjectSchema),
          z.string(),
        ])
        .optional(),
      entity: z
        .union([
          z.lazy(() => Enumdelist_entityWithAggregatesFilterObjectSchema),
          z.lazy(() => delist_entitySchema),
        ])
        .optional(),
      created_at: z
        .union([
          z.lazy(() => DateTimeWithAggregatesFilterObjectSchema),
          z.coerce.date(),
        ])
        .optional(),
    })
    .strict();

export const delist_status_cursorScalarWhereWithAggregatesInputObjectSchema =
  Schema;
