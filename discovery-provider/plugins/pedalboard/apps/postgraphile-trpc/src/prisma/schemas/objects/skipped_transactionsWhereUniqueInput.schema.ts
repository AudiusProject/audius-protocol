import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.skipped_transactionsWhereUniqueInput> = z
  .object({
    id: z.number().optional(),
  })
  .strict();

export const skipped_transactionsWhereUniqueInputObjectSchema = Schema;
