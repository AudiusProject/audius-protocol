import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.alembic_versionWhereUniqueInput> = z
  .object({
    version_num: z.string().optional(),
  })
  .strict();

export const alembic_versionWhereUniqueInputObjectSchema = Schema;
