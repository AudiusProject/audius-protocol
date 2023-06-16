import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_pubkeysCreateInput> = z
  .object({
    user_id: z.number(),
    pubkey_base64: z.string(),
  })
  .strict();

export const user_pubkeysCreateInputObjectSchema = Schema;
