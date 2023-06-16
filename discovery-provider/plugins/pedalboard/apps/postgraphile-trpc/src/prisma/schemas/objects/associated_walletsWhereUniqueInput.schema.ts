import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.associated_walletsWhereUniqueInput> = z
  .object({
    id: z.number().optional(),
  })
  .strict();

export const associated_walletsWhereUniqueInputObjectSchema = Schema;
