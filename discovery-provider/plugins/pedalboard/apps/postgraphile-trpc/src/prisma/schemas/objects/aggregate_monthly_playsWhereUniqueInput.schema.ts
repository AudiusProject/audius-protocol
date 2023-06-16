import { z } from 'zod';
import { aggregate_monthly_playsPlay_item_idTimestampCompoundUniqueInputObjectSchema } from './aggregate_monthly_playsPlay_item_idTimestampCompoundUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_monthly_playsWhereUniqueInput> = z
  .object({
    play_item_id_timestamp: z
      .lazy(
        () =>
          aggregate_monthly_playsPlay_item_idTimestampCompoundUniqueInputObjectSchema,
      )
      .optional(),
  })
  .strict();

export const aggregate_monthly_playsWhereUniqueInputObjectSchema = Schema;
