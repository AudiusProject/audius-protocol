import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.followsCreateInput> = z
  .object({
    blockhash: z.string().optional().nullable(),
    blocknumber: z.number().optional().nullable(),
    follower_user_id: z.number(),
    followee_user_id: z.number(),
    is_current: z.boolean(),
    is_delete: z.boolean(),
    created_at: z.coerce.date(),
    txhash: z.string().optional(),
    slot: z.number().optional().nullable(),
  })
  .strict();

export const followsCreateInputObjectSchema = Schema;
