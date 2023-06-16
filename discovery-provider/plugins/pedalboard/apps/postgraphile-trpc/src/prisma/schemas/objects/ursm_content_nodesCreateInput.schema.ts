import { z } from 'zod';
import { ursm_content_nodesCreateproposer_sp_idsInputObjectSchema } from './ursm_content_nodesCreateproposer_sp_idsInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.ursm_content_nodesCreateInput> = z
  .object({
    blockhash: z.string().optional().nullable(),
    blocknumber: z.number().optional().nullable(),
    created_at: z.coerce.date(),
    is_current: z.boolean(),
    cnode_sp_id: z.number(),
    delegate_owner_wallet: z.string(),
    owner_wallet: z.string(),
    proposer_sp_ids: z
      .union([
        z.lazy(() => ursm_content_nodesCreateproposer_sp_idsInputObjectSchema),
        z.number().array(),
      ])
      .optional(),
    proposer_1_delegate_owner_wallet: z.string(),
    proposer_2_delegate_owner_wallet: z.string(),
    proposer_3_delegate_owner_wallet: z.string(),
    endpoint: z.string().optional().nullable(),
    txhash: z.string().optional(),
    slot: z.number().optional().nullable(),
  })
  .strict();

export const ursm_content_nodesCreateInputObjectSchema = Schema;
