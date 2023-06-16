import { z } from 'zod';
import { IntFilterObjectSchema } from './IntFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.remixesWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => remixesWhereInputObjectSchema),
        z.lazy(() => remixesWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => remixesWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => remixesWhereInputObjectSchema),
        z.lazy(() => remixesWhereInputObjectSchema).array(),
      ])
      .optional(),
    parent_track_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    child_track_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
  })
  .strict();

export const remixesWhereInputObjectSchema = Schema;
