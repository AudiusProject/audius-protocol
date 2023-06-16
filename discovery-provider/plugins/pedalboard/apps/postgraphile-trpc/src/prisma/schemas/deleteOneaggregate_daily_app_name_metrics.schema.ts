import { z } from 'zod';
import { aggregate_daily_app_name_metricsWhereUniqueInputObjectSchema } from './objects/aggregate_daily_app_name_metricsWhereUniqueInput.schema';

export const aggregate_daily_app_name_metricsDeleteOneSchema = z.object({
  where: aggregate_daily_app_name_metricsWhereUniqueInputObjectSchema,
});
