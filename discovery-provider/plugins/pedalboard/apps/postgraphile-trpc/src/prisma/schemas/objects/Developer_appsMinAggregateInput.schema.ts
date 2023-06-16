import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Developer_appsMinAggregateInputType> = z
  .object({
    address: z.literal(true).optional(),
    blockhash: z.literal(true).optional(),
    blocknumber: z.literal(true).optional(),
    user_id: z.literal(true).optional(),
    name: z.literal(true).optional(),
    is_personal_access: z.literal(true).optional(),
    is_delete: z.literal(true).optional(),
    created_at: z.literal(true).optional(),
    txhash: z.literal(true).optional(),
    is_current: z.literal(true).optional(),
    updated_at: z.literal(true).optional(),
    description: z.literal(true).optional(),
  })
  .strict();

export const Developer_appsMinAggregateInputObjectSchema = Schema;
