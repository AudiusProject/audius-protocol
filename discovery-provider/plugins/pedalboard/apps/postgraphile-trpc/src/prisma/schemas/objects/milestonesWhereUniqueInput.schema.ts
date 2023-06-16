import { z } from 'zod';
import { milestonesIdNameThresholdCompoundUniqueInputObjectSchema } from './milestonesIdNameThresholdCompoundUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.milestonesWhereUniqueInput> = z
  .object({
    id_name_threshold: z
      .lazy(() => milestonesIdNameThresholdCompoundUniqueInputObjectSchema)
      .optional(),
  })
  .strict();

export const milestonesWhereUniqueInputObjectSchema = Schema;
