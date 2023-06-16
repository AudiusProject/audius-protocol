import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.pubkeysCreateManyInput> = z
  .object({
    wallet: z.string(),
    pubkey: z.string().optional().nullable(),
  })
  .strict();

export const pubkeysCreateManyInputObjectSchema = Schema;
