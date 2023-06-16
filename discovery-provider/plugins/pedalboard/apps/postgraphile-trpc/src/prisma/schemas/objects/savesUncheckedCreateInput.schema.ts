import { z } from 'zod';
import { savetypeSchema } from '../enums/savetype.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.savesUncheckedCreateInput> = z
  .object({
    blockhash: z.string().optional().nullable(),
    blocknumber: z.number().optional().nullable(),
    user_id: z.number(),
    save_item_id: z.number(),
    save_type: z.lazy(() => savetypeSchema),
    is_current: z.boolean(),
    is_delete: z.boolean(),
    created_at: z.coerce.date(),
    txhash: z.string().optional(),
    slot: z.number().optional().nullable(),
    is_save_of_repost: z.boolean().optional(),
  })
  .strict();

export const savesUncheckedCreateInputObjectSchema = Schema;
