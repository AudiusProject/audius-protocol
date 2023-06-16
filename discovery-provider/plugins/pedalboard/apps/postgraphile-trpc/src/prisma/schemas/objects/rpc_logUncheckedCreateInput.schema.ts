import { z } from 'zod';
import { JsonNullValueInputSchema } from '../enums/JsonNullValueInput.schema';

import type { Prisma } from '@prisma/client';

const literalSchema = z.union([z.string(), z.number(), z.boolean()]);
const jsonSchema: z.ZodType<Prisma.InputJsonValue> = z.lazy(() =>
  z.union([
    literalSchema,
    z.array(jsonSchema.nullable()),
    z.record(jsonSchema.nullable()),
  ]),
);

const Schema: z.ZodType<Prisma.rpc_logUncheckedCreateInput> = z
  .object({
    relayed_at: z.coerce.date(),
    from_wallet: z.string(),
    rpc: z.union([z.lazy(() => JsonNullValueInputSchema), jsonSchema]),
    sig: z.string(),
    relayed_by: z.string(),
    applied_at: z.coerce.date(),
  })
  .strict();

export const rpc_logUncheckedCreateInputObjectSchema = Schema;
