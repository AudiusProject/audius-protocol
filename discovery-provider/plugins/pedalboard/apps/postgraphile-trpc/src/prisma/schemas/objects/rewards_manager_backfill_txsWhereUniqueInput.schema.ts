import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.rewards_manager_backfill_txsWhereUniqueInput> = z
  .object({
    signature: z.string().optional(),
  })
  .strict();

export const rewards_manager_backfill_txsWhereUniqueInputObjectSchema = Schema;
