import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.User_pubkeysMaxAggregateInputType> = z
  .object({
    user_id: z.literal(true).optional(),
    pubkey_base64: z.literal(true).optional(),
  })
  .strict();

export const User_pubkeysMaxAggregateInputObjectSchema = Schema;
