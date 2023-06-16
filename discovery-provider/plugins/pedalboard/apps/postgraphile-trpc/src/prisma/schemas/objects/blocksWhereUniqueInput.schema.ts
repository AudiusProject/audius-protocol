import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.blocksWhereUniqueInput> = z
  .object({
    blockhash: z.string().optional(),
    number: z.number().optional(),
  })
  .strict();

export const blocksWhereUniqueInputObjectSchema = Schema;
