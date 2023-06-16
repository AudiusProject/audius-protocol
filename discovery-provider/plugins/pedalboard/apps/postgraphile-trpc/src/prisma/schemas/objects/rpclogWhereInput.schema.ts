import { z } from 'zod';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { StringNullableFilterObjectSchema } from './StringNullableFilter.schema';
import { JsonNullableFilterObjectSchema } from './JsonNullableFilter.schema';
import { IntNullableFilterObjectSchema } from './IntNullableFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.rpclogWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => rpclogWhereInputObjectSchema),
        z.lazy(() => rpclogWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => rpclogWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => rpclogWhereInputObjectSchema),
        z.lazy(() => rpclogWhereInputObjectSchema).array(),
      ])
      .optional(),
    cuid: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    wallet: z
      .union([z.lazy(() => StringNullableFilterObjectSchema), z.string()])
      .optional()
      .nullable(),
    method: z
      .union([z.lazy(() => StringNullableFilterObjectSchema), z.string()])
      .optional()
      .nullable(),
    params: z.lazy(() => JsonNullableFilterObjectSchema).optional(),
    jetstream_seq: z
      .union([z.lazy(() => IntNullableFilterObjectSchema), z.number()])
      .optional()
      .nullable(),
  })
  .strict();

export const rpclogWhereInputObjectSchema = Schema;
