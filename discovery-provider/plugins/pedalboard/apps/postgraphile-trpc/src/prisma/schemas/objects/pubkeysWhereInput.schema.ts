import { z } from 'zod';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { StringNullableFilterObjectSchema } from './StringNullableFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.pubkeysWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => pubkeysWhereInputObjectSchema),
        z.lazy(() => pubkeysWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => pubkeysWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => pubkeysWhereInputObjectSchema),
        z.lazy(() => pubkeysWhereInputObjectSchema).array(),
      ])
      .optional(),
    wallet: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    pubkey: z
      .union([z.lazy(() => StringNullableFilterObjectSchema), z.string()])
      .optional()
      .nullable(),
  })
  .strict();

export const pubkeysWhereInputObjectSchema = Schema;
