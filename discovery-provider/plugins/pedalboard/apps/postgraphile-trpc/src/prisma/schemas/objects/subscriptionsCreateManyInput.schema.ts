import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.subscriptionsCreateManyInput> = z
  .object({
    blockhash: z.string().optional().nullable(),
    blocknumber: z.number().optional().nullable(),
    subscriber_id: z.number(),
    user_id: z.number(),
    is_current: z.boolean(),
    is_delete: z.boolean(),
    created_at: z.coerce.date().optional(),
    txhash: z.string().optional(),
  })
  .strict();

export const subscriptionsCreateManyInputObjectSchema = Schema;
