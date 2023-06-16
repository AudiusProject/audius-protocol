import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.reward_manager_txsCreateManyInput> = z
  .object({
    signature: z.string(),
    slot: z.number(),
    created_at: z.coerce.date(),
  })
  .strict();

export const reward_manager_txsCreateManyInputObjectSchema = Schema;
