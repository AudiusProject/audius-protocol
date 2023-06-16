import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.alembic_versionUncheckedCreateInput> = z
  .object({
    version_num: z.string(),
  })
  .strict();

export const alembic_versionUncheckedCreateInputObjectSchema = Schema;
