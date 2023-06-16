import { z } from 'zod';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { StringNullableFilterObjectSchema } from './StringNullableFilter.schema';
import { JsonNullableFilterObjectSchema } from './JsonNullableFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.cid_dataWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => cid_dataWhereInputObjectSchema),
        z.lazy(() => cid_dataWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => cid_dataWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => cid_dataWhereInputObjectSchema),
        z.lazy(() => cid_dataWhereInputObjectSchema).array(),
      ])
      .optional(),
    cid: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    type: z
      .union([z.lazy(() => StringNullableFilterObjectSchema), z.string()])
      .optional()
      .nullable(),
    data: z.lazy(() => JsonNullableFilterObjectSchema).optional(),
  })
  .strict();

export const cid_dataWhereInputObjectSchema = Schema;
