import { z } from 'zod';
import { aggregate_daily_app_name_metricsUpdateInputObjectSchema } from './objects/aggregate_daily_app_name_metricsUpdateInput.schema';
import { aggregate_daily_app_name_metricsUncheckedUpdateInputObjectSchema } from './objects/aggregate_daily_app_name_metricsUncheckedUpdateInput.schema';
import { aggregate_daily_app_name_metricsWhereUniqueInputObjectSchema } from './objects/aggregate_daily_app_name_metricsWhereUniqueInput.schema';

export const aggregate_daily_app_name_metricsUpdateOneSchema = z.object({
  data: z.union([
    aggregate_daily_app_name_metricsUpdateInputObjectSchema,
    aggregate_daily_app_name_metricsUncheckedUpdateInputObjectSchema,
  ]),
  where: aggregate_daily_app_name_metricsWhereUniqueInputObjectSchema,
});
