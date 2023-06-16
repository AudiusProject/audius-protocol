import { z } from 'zod';
import { IntFilterObjectSchema } from './IntFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_banWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => chat_banWhereInputObjectSchema),
        z.lazy(() => chat_banWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => chat_banWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => chat_banWhereInputObjectSchema),
        z.lazy(() => chat_banWhereInputObjectSchema).array(),
      ])
      .optional(),
    user_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
  })
  .strict();

export const chat_banWhereInputObjectSchema = Schema;
