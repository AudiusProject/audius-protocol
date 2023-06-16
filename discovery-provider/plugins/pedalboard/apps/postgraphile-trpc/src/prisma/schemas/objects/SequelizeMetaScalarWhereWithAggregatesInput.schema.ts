import { z } from 'zod';
import { StringWithAggregatesFilterObjectSchema } from './StringWithAggregatesFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.SequelizeMetaScalarWhereWithAggregatesInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => SequelizeMetaScalarWhereWithAggregatesInputObjectSchema),
        z
          .lazy(() => SequelizeMetaScalarWhereWithAggregatesInputObjectSchema)
          .array(),
      ])
      .optional(),
    OR: z
      .lazy(() => SequelizeMetaScalarWhereWithAggregatesInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => SequelizeMetaScalarWhereWithAggregatesInputObjectSchema),
        z
          .lazy(() => SequelizeMetaScalarWhereWithAggregatesInputObjectSchema)
          .array(),
      ])
      .optional(),
    name: z
      .union([z.lazy(() => StringWithAggregatesFilterObjectSchema), z.string()])
      .optional(),
  })
  .strict();

export const SequelizeMetaScalarWhereWithAggregatesInputObjectSchema = Schema;
