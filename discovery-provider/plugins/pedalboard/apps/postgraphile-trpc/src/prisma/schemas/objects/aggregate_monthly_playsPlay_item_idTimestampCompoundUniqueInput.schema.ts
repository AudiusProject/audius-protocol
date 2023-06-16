import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_monthly_playsPlay_item_idTimestampCompoundUniqueInput> =
  z
    .object({
      play_item_id: z.number(),
      timestamp: z.coerce.date(),
    })
    .strict();

export const aggregate_monthly_playsPlay_item_idTimestampCompoundUniqueInputObjectSchema =
  Schema;
