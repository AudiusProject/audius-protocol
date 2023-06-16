import { z } from 'zod';
import { aggregate_daily_app_name_metricsCreateInputObjectSchema } from './objects/aggregate_daily_app_name_metricsCreateInput.schema';
import { aggregate_daily_app_name_metricsUncheckedCreateInputObjectSchema } from './objects/aggregate_daily_app_name_metricsUncheckedCreateInput.schema';

export const aggregate_daily_app_name_metricsCreateOneSchema = z.object({
  data: z.union([
    aggregate_daily_app_name_metricsCreateInputObjectSchema,
    aggregate_daily_app_name_metricsUncheckedCreateInputObjectSchema,
  ]),
});
