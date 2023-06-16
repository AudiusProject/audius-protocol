import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.spl_token_txWhereUniqueInput> = z
  .object({
    last_scanned_slot: z.number().optional(),
  })
  .strict();

export const spl_token_txWhereUniqueInputObjectSchema = Schema;
