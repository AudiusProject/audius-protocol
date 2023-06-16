import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.schema_versionUncheckedCreateInput> = z
  .object({
    file_name: z.string(),
    md5: z.string().optional().nullable(),
    applied_at: z.coerce.date().optional(),
  })
  .strict();

export const schema_versionUncheckedCreateInputObjectSchema = Schema;
