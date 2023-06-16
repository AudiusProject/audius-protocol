import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.playsCreateInput> = z
  .object({
    user_id: z.number().optional().nullable(),
    source: z.string().optional().nullable(),
    play_item_id: z.number(),
    created_at: z.coerce.date().optional(),
    updated_at: z.coerce.date().optional(),
    slot: z.number().optional().nullable(),
    signature: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    region: z.string().optional().nullable(),
    country: z.string().optional().nullable(),
  })
  .strict();

export const playsCreateInputObjectSchema = Schema;
