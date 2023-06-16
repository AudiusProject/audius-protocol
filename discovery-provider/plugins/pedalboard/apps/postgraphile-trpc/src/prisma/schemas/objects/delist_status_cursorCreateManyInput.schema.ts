import { z } from 'zod';
import { delist_entitySchema } from '../enums/delist_entity.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.delist_status_cursorCreateManyInput> = z
  .object({
    host: z.string(),
    entity: z.lazy(() => delist_entitySchema),
    created_at: z.coerce.date(),
  })
  .strict();

export const delist_status_cursorCreateManyInputObjectSchema = Schema;
