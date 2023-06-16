import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.alembic_versionCreateInput> = z
  .object({
    version_num: z.string(),
  })
  .strict();

export const alembic_versionCreateInputObjectSchema = Schema;
