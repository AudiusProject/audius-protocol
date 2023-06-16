import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.rewards_manager_backfill_txsUncheckedCreateInput> =
  z
    .object({
      signature: z.string(),
      slot: z.number(),
      created_at: z.coerce.date(),
    })
    .strict();

export const rewards_manager_backfill_txsUncheckedCreateInputObjectSchema =
  Schema;
