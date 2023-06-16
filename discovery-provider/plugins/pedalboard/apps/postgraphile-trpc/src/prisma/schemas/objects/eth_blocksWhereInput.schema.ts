import { z } from 'zod';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.eth_blocksWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => eth_blocksWhereInputObjectSchema),
        z.lazy(() => eth_blocksWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => eth_blocksWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => eth_blocksWhereInputObjectSchema),
        z.lazy(() => eth_blocksWhereInputObjectSchema).array(),
      ])
      .optional(),
    last_scanned_block: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    created_at: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
    updated_at: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
  })
  .strict();

export const eth_blocksWhereInputObjectSchema = Schema;
