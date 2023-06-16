import { z } from 'zod';
import { trending_resultsRankTypeVersionWeekCompoundUniqueInputObjectSchema } from './trending_resultsRankTypeVersionWeekCompoundUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.trending_resultsWhereUniqueInput> = z
  .object({
    rank_type_version_week: z
      .lazy(
        () =>
          trending_resultsRankTypeVersionWeekCompoundUniqueInputObjectSchema,
      )
      .optional(),
  })
  .strict();

export const trending_resultsWhereUniqueInputObjectSchema = Schema;
