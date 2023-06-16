import { z } from 'zod';
import { savetypeSchema } from '../enums/savetype.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.savesIs_currentUser_idSave_item_idSave_typeTxhashCompoundUniqueInput> =
  z
    .object({
      is_current: z.boolean(),
      user_id: z.number(),
      save_item_id: z.number(),
      save_type: z.lazy(() => savetypeSchema),
      txhash: z.string(),
    })
    .strict();

export const savesIs_currentUser_idSave_item_idSave_typeTxhashCompoundUniqueInputObjectSchema =
  Schema;
