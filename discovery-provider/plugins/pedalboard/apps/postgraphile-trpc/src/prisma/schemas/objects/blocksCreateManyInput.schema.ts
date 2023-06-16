import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.blocksCreateManyInput> = z
  .object({
    blockhash: z.string(),
    parenthash: z.string().optional().nullable(),
    is_current: z.boolean().optional().nullable(),
    number: z.number().optional().nullable(),
  })
  .strict();

export const blocksCreateManyInputObjectSchema = Schema;
