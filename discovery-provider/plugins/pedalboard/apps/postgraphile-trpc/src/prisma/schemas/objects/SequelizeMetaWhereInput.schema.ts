import { z } from 'zod';
import { StringFilterObjectSchema } from './StringFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.SequelizeMetaWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => SequelizeMetaWhereInputObjectSchema),
        z.lazy(() => SequelizeMetaWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => SequelizeMetaWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => SequelizeMetaWhereInputObjectSchema),
        z.lazy(() => SequelizeMetaWhereInputObjectSchema).array(),
      ])
      .optional(),
    name: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
  })
  .strict();

export const SequelizeMetaWhereInputObjectSchema = Schema;
