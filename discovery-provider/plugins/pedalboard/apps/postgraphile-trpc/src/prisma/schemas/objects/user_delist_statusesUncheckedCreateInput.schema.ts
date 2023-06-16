import { z } from 'zod';
import { delist_user_reasonSchema } from '../enums/delist_user_reason.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_delist_statusesUncheckedCreateInput> = z
  .object({
    created_at: z.coerce.date(),
    user_id: z.number(),
    delisted: z.boolean(),
    reason: z.lazy(() => delist_user_reasonSchema),
  })
  .strict();

export const user_delist_statusesUncheckedCreateInputObjectSchema = Schema;
