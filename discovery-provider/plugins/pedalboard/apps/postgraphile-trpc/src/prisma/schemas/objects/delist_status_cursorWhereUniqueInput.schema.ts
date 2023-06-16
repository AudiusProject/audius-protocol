import { z } from 'zod';
import { delist_status_cursorHostEntityCompoundUniqueInputObjectSchema } from './delist_status_cursorHostEntityCompoundUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.delist_status_cursorWhereUniqueInput> = z
  .object({
    host_entity: z
      .lazy(() => delist_status_cursorHostEntityCompoundUniqueInputObjectSchema)
      .optional(),
  })
  .strict();

export const delist_status_cursorWhereUniqueInputObjectSchema = Schema;
