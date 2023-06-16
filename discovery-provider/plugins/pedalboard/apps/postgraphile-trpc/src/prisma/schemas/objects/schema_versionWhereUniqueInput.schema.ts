import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.schema_versionWhereUniqueInput> = z
  .object({
    file_name: z.string().optional(),
  })
  .strict();

export const schema_versionWhereUniqueInputObjectSchema = Schema;
