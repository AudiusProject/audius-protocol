import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Ursm_content_nodesAvgAggregateInputType> = z
  .object({
    blocknumber: z.literal(true).optional(),
    cnode_sp_id: z.literal(true).optional(),
    proposer_sp_ids: z.literal(true).optional(),
    slot: z.literal(true).optional(),
  })
  .strict();

export const Ursm_content_nodesAvgAggregateInputObjectSchema = Schema;
