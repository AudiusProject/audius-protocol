import { z } from 'zod';
import { reposttypeSchema } from '../enums/reposttype.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.repostsCreateManyInput> = z
  .object({
    blockhash: z.string().optional().nullable(),
    blocknumber: z.number().optional().nullable(),
    user_id: z.number(),
    repost_item_id: z.number(),
    repost_type: z.lazy(() => reposttypeSchema),
    is_current: z.boolean(),
    is_delete: z.boolean(),
    created_at: z.coerce.date(),
    txhash: z.string().optional(),
    slot: z.number().optional().nullable(),
    is_repost_of_repost: z.boolean().optional(),
  })
  .strict();

export const repostsCreateManyInputObjectSchema = Schema;
