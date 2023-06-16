import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.pubkeysCreateInput> = z
  .object({
    wallet: z.string(),
    pubkey: z.string().optional().nullable(),
  })
  .strict();

export const pubkeysCreateInputObjectSchema = Schema;
