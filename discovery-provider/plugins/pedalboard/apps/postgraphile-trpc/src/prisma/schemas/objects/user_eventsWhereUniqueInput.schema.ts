import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_eventsWhereUniqueInput> = z
  .object({
    id: z.number().optional(),
  })
  .strict();

export const user_eventsWhereUniqueInputObjectSchema = Schema;
