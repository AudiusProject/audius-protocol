import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.RepostsMaxAggregateInputType> = z
  .object({
    blockhash: z.literal(true).optional(),
    blocknumber: z.literal(true).optional(),
    user_id: z.literal(true).optional(),
    repost_item_id: z.literal(true).optional(),
    repost_type: z.literal(true).optional(),
    is_current: z.literal(true).optional(),
    is_delete: z.literal(true).optional(),
    created_at: z.literal(true).optional(),
    txhash: z.literal(true).optional(),
    slot: z.literal(true).optional(),
    is_repost_of_repost: z.literal(true).optional(),
  })
  .strict();

export const RepostsMaxAggregateInputObjectSchema = Schema;
