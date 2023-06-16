import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_bank_txsWhereUniqueInput> = z
  .object({
    signature: z.string().optional(),
  })
  .strict();

export const user_bank_txsWhereUniqueInputObjectSchema = Schema;
