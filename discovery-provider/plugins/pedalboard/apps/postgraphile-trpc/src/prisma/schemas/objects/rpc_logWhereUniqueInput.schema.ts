import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.rpc_logWhereUniqueInput> = z
  .object({
    sig: z.string().optional(),
  })
  .strict();

export const rpc_logWhereUniqueInputObjectSchema = Schema;
