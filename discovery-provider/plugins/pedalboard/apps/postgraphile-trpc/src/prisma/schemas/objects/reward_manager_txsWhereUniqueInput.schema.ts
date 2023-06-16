import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.reward_manager_txsWhereUniqueInput> = z
  .object({
    signature: z.string().optional(),
  })
  .strict();

export const reward_manager_txsWhereUniqueInputObjectSchema = Schema;
