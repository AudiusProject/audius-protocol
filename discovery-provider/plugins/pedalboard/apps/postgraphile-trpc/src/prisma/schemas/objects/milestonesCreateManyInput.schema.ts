import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.milestonesCreateManyInput> = z
  .object({
    id: z.number(),
    name: z.string(),
    threshold: z.number(),
    blocknumber: z.number().optional().nullable(),
    slot: z.number().optional().nullable(),
    timestamp: z.coerce.date(),
  })
  .strict();

export const milestonesCreateManyInputObjectSchema = Schema;
