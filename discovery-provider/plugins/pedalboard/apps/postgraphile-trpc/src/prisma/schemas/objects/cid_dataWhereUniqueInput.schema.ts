import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.cid_dataWhereUniqueInput> = z
  .object({
    cid: z.string().optional(),
  })
  .strict();

export const cid_dataWhereUniqueInputObjectSchema = Schema;
