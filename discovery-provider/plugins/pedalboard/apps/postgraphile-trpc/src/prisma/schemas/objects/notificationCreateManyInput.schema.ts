import { z } from 'zod';
import { NullableJsonNullValueInputSchema } from '../enums/NullableJsonNullValueInput.schema';
import { notificationCreateuser_idsInputObjectSchema } from './notificationCreateuser_idsInput.schema';

import type { Prisma } from '@prisma/client';

const literalSchema = z.union([z.string(), z.number(), z.boolean()]);
const jsonSchema: z.ZodType<Prisma.InputJsonValue> = z.lazy(() =>
  z.union([
    literalSchema,
    z.array(jsonSchema.nullable()),
    z.record(jsonSchema.nullable()),
  ]),
);

const Schema: z.ZodType<Prisma.notificationCreateManyInput> = z
  .object({
    id: z.number().optional(),
    specifier: z.string(),
    group_id: z.string(),
    type: z.string(),
    slot: z.number().optional().nullable(),
    blocknumber: z.number().optional().nullable(),
    timestamp: z.coerce.date(),
    data: z
      .union([z.lazy(() => NullableJsonNullValueInputSchema), jsonSchema])
      .optional(),
    user_ids: z
      .union([
        z.lazy(() => notificationCreateuser_idsInputObjectSchema),
        z.number().array(),
      ])
      .optional(),
    type_v2: z.string().optional().nullable(),
  })
  .strict();

export const notificationCreateManyInputObjectSchema = Schema;
