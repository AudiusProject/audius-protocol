import { z } from 'zod';
import { NullableJsonNullValueInputSchema } from '../enums/NullableJsonNullValueInput.schema';

import type { Prisma } from '@prisma/client';

const literalSchema = z.union([z.string(), z.number(), z.boolean()]);
const jsonSchema: z.ZodType<Prisma.InputJsonValue> = z.lazy(() =>
  z.union([
    literalSchema,
    z.array(jsonSchema.nullable()),
    z.record(jsonSchema.nullable()),
  ]),
);

const Schema: z.ZodType<Prisma.rpclogCreateInput> = z
  .object({
    cuid: z.string(),
    wallet: z.string().optional().nullable(),
    method: z.string().optional().nullable(),
    params: z
      .union([z.lazy(() => NullableJsonNullValueInputSchema), jsonSchema])
      .optional(),
    jetstream_seq: z.number().optional().nullable(),
  })
  .strict();

export const rpclogCreateInputObjectSchema = Schema;
