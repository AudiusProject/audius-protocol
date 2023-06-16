import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.rpc_cursorWhereUniqueInput> = z
  .object({
    relayed_by: z.string().optional(),
  })
  .strict();

export const rpc_cursorWhereUniqueInputObjectSchema = Schema;
