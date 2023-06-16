import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.reactionsCreateInput> = z
  .object({
    slot: z.number(),
    reaction_value: z.number(),
    sender_wallet: z.string(),
    reaction_type: z.string(),
    reacted_to: z.string(),
    timestamp: z.coerce.date(),
    tx_signature: z.string().optional().nullable(),
  })
  .strict();

export const reactionsCreateInputObjectSchema = Schema;
