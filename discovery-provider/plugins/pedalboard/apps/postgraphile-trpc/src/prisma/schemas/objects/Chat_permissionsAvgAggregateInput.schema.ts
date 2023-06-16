import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Chat_permissionsAvgAggregateInputType> = z
  .object({
    user_id: z.literal(true).optional(),
  })
  .strict();

export const Chat_permissionsAvgAggregateInputObjectSchema = Schema;
