import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Alembic_versionCountAggregateInputType> = z
  .object({
    version_num: z.literal(true).optional(),
    _all: z.literal(true).optional(),
  })
  .strict();

export const Alembic_versionCountAggregateInputObjectSchema = Schema;
