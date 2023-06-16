import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.trending_resultsRankTypeVersionWeekCompoundUniqueInput> =
  z
    .object({
      rank: z.number(),
      type: z.string(),
      version: z.string(),
      week: z.coerce.date(),
    })
    .strict();

export const trending_resultsRankTypeVersionWeekCompoundUniqueInputObjectSchema =
  Schema;
