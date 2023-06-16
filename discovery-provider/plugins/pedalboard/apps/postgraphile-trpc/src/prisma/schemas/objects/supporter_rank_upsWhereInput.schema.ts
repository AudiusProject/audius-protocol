import { z } from 'zod';
import { IntFilterObjectSchema } from './IntFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.supporter_rank_upsWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => supporter_rank_upsWhereInputObjectSchema),
        z.lazy(() => supporter_rank_upsWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => supporter_rank_upsWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => supporter_rank_upsWhereInputObjectSchema),
        z.lazy(() => supporter_rank_upsWhereInputObjectSchema).array(),
      ])
      .optional(),
    slot: z.union([z.lazy(() => IntFilterObjectSchema), z.number()]).optional(),
    sender_user_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    receiver_user_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    rank: z.union([z.lazy(() => IntFilterObjectSchema), z.number()]).optional(),
  })
  .strict();

export const supporter_rank_upsWhereInputObjectSchema = Schema;
