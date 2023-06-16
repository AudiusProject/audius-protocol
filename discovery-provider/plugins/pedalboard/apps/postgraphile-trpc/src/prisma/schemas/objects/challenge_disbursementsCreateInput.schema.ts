import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.challenge_disbursementsCreateInput> = z
  .object({
    challenge_id: z.string(),
    user_id: z.number(),
    specifier: z.string(),
    signature: z.string(),
    slot: z.number(),
    amount: z.string(),
  })
  .strict();

export const challenge_disbursementsCreateInputObjectSchema = Schema;
