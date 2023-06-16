import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_eventsCreateInput> = z
  .object({
    blockhash: z.string().optional().nullable(),
    blocknumber: z.number().optional().nullable(),
    is_current: z.boolean(),
    user_id: z.number(),
    referrer: z.number().optional().nullable(),
    is_mobile_user: z.boolean().optional(),
    slot: z.number().optional().nullable(),
  })
  .strict();

export const user_eventsCreateInputObjectSchema = Schema;
