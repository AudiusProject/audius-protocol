import { z } from 'zod';
import { aggregate_daily_app_name_metricsWhereInputObjectSchema } from './objects/aggregate_daily_app_name_metricsWhereInput.schema';

export const aggregate_daily_app_name_metricsDeleteManySchema = z.object({
  where: aggregate_daily_app_name_metricsWhereInputObjectSchema.optional(),
});
