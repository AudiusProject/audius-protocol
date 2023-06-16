import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.audius_data_txsCreateInput> = z
  .object({
    signature: z.string(),
    slot: z.number(),
  })
  .strict();

export const audius_data_txsCreateInputObjectSchema = Schema;
