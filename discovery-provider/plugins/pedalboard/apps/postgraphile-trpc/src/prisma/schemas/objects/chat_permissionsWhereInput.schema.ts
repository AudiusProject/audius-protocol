import { z } from 'zod';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { StringNullableFilterObjectSchema } from './StringNullableFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_permissionsWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => chat_permissionsWhereInputObjectSchema),
        z.lazy(() => chat_permissionsWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => chat_permissionsWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => chat_permissionsWhereInputObjectSchema),
        z.lazy(() => chat_permissionsWhereInputObjectSchema).array(),
      ])
      .optional(),
    user_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    permits: z
      .union([z.lazy(() => StringNullableFilterObjectSchema), z.string()])
      .optional()
      .nullable(),
  })
  .strict();

export const chat_permissionsWhereInputObjectSchema = Schema;
