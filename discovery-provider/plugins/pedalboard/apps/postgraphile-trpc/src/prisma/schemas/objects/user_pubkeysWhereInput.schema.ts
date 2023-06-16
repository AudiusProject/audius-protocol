import { z } from 'zod';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { StringFilterObjectSchema } from './StringFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_pubkeysWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => user_pubkeysWhereInputObjectSchema),
        z.lazy(() => user_pubkeysWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => user_pubkeysWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => user_pubkeysWhereInputObjectSchema),
        z.lazy(() => user_pubkeysWhereInputObjectSchema).array(),
      ])
      .optional(),
    user_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    pubkey_base64: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
  })
  .strict();

export const user_pubkeysWhereInputObjectSchema = Schema;
