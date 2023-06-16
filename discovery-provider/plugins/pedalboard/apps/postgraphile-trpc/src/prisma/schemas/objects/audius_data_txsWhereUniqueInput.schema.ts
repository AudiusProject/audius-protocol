import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.audius_data_txsWhereUniqueInput> = z
  .object({
    signature: z.string().optional(),
  })
  .strict();

export const audius_data_txsWhereUniqueInputObjectSchema = Schema;
