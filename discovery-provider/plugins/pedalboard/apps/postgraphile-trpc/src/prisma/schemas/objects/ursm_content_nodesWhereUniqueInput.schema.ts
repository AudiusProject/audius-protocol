import { z } from 'zod';
import { ursm_content_nodesIs_currentCnode_sp_idTxhashCompoundUniqueInputObjectSchema } from './ursm_content_nodesIs_currentCnode_sp_idTxhashCompoundUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.ursm_content_nodesWhereUniqueInput> = z
  .object({
    is_current_cnode_sp_id_txhash: z
      .lazy(
        () =>
          ursm_content_nodesIs_currentCnode_sp_idTxhashCompoundUniqueInputObjectSchema,
      )
      .optional(),
  })
  .strict();

export const ursm_content_nodesWhereUniqueInputObjectSchema = Schema;
