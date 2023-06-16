import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_user_tipsCreateManyInput> = z
  .object({
    sender_user_id: z.number(),
    receiver_user_id: z.number(),
    amount: z.bigint(),
  })
  .strict();

export const aggregate_user_tipsCreateManyInputObjectSchema = Schema;
