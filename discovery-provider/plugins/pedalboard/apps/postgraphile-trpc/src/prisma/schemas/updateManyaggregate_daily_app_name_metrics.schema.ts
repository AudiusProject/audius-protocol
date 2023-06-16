import { z } from 'zod';
import { aggregate_daily_app_name_metricsUpdateManyMutationInputObjectSchema } from './objects/aggregate_daily_app_name_metricsUpdateManyMutationInput.schema';
import { aggregate_daily_app_name_metricsWhereInputObjectSchema } from './objects/aggregate_daily_app_name_metricsWhereInput.schema';

export const aggregate_daily_app_name_metricsUpdateManySchema = z.object({
  data: aggregate_daily_app_name_metricsUpdateManyMutationInputObjectSchema,
  where: aggregate_daily_app_name_metricsWhereInputObjectSchema.optional(),
});
