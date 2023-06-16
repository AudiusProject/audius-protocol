import { z } from 'zod';
import { IntFilterObjectSchema } from './IntFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.stemsWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => stemsWhereInputObjectSchema),
        z.lazy(() => stemsWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => stemsWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => stemsWhereInputObjectSchema),
        z.lazy(() => stemsWhereInputObjectSchema).array(),
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

export const stemsWhereInputObjectSchema = Schema;
