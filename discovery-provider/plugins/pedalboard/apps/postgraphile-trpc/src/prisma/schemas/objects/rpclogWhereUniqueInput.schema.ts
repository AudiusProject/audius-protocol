import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.rpclogWhereUniqueInput> = z
  .object({
    cuid: z.string().optional(),
  })
  .strict();

export const rpclogWhereUniqueInputObjectSchema = Schema;
