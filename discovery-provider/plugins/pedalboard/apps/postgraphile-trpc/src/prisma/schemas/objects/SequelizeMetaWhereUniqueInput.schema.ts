import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.SequelizeMetaWhereUniqueInput> = z
  .object({
    name: z.string().optional(),
  })
  .strict();

export const SequelizeMetaWhereUniqueInputObjectSchema = Schema;
