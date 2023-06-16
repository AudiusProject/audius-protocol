import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Associated_walletsMaxAggregateInputType> = z
  .object({
    id: z.literal(true).optional(),
    user_id: z.literal(true).optional(),
    wallet: z.literal(true).optional(),
    blockhash: z.literal(true).optional(),
    blocknumber: z.literal(true).optional(),
    is_current: z.literal(true).optional(),
    is_delete: z.literal(true).optional(),
    chain: z.literal(true).optional(),
  })
  .strict();

export const Associated_walletsMaxAggregateInputObjectSchema = Schema;
