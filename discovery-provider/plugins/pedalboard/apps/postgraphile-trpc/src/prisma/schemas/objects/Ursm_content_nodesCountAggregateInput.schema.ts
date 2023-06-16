import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Ursm_content_nodesCountAggregateInputType> = z
  .object({
    blockhash: z.literal(true).optional(),
    blocknumber: z.literal(true).optional(),
    created_at: z.literal(true).optional(),
    is_current: z.literal(true).optional(),
    cnode_sp_id: z.literal(true).optional(),
    delegate_owner_wallet: z.literal(true).optional(),
    owner_wallet: z.literal(true).optional(),
    proposer_sp_ids: z.literal(true).optional(),
    proposer_1_delegate_owner_wallet: z.literal(true).optional(),
    proposer_2_delegate_owner_wallet: z.literal(true).optional(),
    proposer_3_delegate_owner_wallet: z.literal(true).optional(),
    endpoint: z.literal(true).optional(),
    txhash: z.literal(true).optional(),
    slot: z.literal(true).optional(),
    _all: z.literal(true).optional(),
  })
  .strict();

export const Ursm_content_nodesCountAggregateInputObjectSchema = Schema;
