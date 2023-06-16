import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.milestonesIdNameThresholdCompoundUniqueInput> = z
  .object({
    id: z.number(),
    name: z.string(),
    threshold: z.number(),
  })
  .strict();

export const milestonesIdNameThresholdCompoundUniqueInputObjectSchema = Schema;
