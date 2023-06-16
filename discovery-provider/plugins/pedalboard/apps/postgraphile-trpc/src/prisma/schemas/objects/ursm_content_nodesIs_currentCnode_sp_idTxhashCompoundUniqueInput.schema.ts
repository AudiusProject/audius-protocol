import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.ursm_content_nodesIs_currentCnode_sp_idTxhashCompoundUniqueInput> =
  z
    .object({
      is_current: z.boolean(),
      cnode_sp_id: z.number(),
      txhash: z.string(),
    })
    .strict();

export const ursm_content_nodesIs_currentCnode_sp_idTxhashCompoundUniqueInputObjectSchema =
  Schema;
