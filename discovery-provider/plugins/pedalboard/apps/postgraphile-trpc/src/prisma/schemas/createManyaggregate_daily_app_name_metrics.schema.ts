import { z } from 'zod';
import { aggregate_daily_app_name_metricsCreateManyInputObjectSchema } from './objects/aggregate_daily_app_name_metricsCreateManyInput.schema';

export const aggregate_daily_app_name_metricsCreateManySchema = z.object({
  data: z.union([
    aggregate_daily_app_name_metricsCreateManyInputObjectSchema,
    z.array(aggregate_daily_app_name_metricsCreateManyInputObjectSchema),
  ]),
  skipDuplicates: z.boolean().optional(),
});
