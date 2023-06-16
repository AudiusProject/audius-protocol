import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.GrantsMaxAggregateInputType> = z
  .object({
    blockhash: z.literal(true).optional(),
    blocknumber: z.literal(true).optional(),
    grantee_address: z.literal(true).optional(),
    user_id: z.literal(true).optional(),
    is_revoked: z.literal(true).optional(),
    is_current: z.literal(true).optional(),
    is_approved: z.literal(true).optional(),
    updated_at: z.literal(true).optional(),
    created_at: z.literal(true).optional(),
    txhash: z.literal(true).optional(),
  })
  .strict();

export const GrantsMaxAggregateInputObjectSchema = Schema;
