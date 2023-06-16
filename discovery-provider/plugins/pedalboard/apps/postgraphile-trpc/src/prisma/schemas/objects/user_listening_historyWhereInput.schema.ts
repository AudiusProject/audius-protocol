import { z } from 'zod';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { JsonFilterObjectSchema } from './JsonFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_listening_historyWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => user_listening_historyWhereInputObjectSchema),
        z.lazy(() => user_listening_historyWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => user_listening_historyWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => user_listening_historyWhereInputObjectSchema),
        z.lazy(() => user_listening_historyWhereInputObjectSchema).array(),
      ])
      .optional(),
    user_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    listening_history: z.lazy(() => JsonFilterObjectSchema).optional(),
  })
  .strict();

export const user_listening_historyWhereInputObjectSchema = Schema;
