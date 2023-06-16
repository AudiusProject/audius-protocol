import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Schema_versionCountAggregateInputType> = z
  .object({
    file_name: z.literal(true).optional(),
    md5: z.literal(true).optional(),
    applied_at: z.literal(true).optional(),
    _all: z.literal(true).optional(),
  })
  .strict();

export const Schema_versionCountAggregateInputObjectSchema = Schema;
