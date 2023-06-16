import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Alembic_versionMinAggregateInputType> = z
  .object({
    version_num: z.literal(true).optional(),
  })
  .strict();

export const Alembic_versionMinAggregateInputObjectSchema = Schema;
