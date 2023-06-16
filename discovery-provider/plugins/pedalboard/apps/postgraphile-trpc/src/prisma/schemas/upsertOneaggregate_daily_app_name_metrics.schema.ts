import { z } from 'zod';
import { aggregate_daily_app_name_metricsWhereUniqueInputObjectSchema } from './objects/aggregate_daily_app_name_metricsWhereUniqueInput.schema';
import { aggregate_daily_app_name_metricsCreateInputObjectSchema } from './objects/aggregate_daily_app_name_metricsCreateInput.schema';
import { aggregate_daily_app_name_metricsUncheckedCreateInputObjectSchema } from './objects/aggregate_daily_app_name_metricsUncheckedCreateInput.schema';
import { aggregate_daily_app_name_metricsUpdateInputObjectSchema } from './objects/aggregate_daily_app_name_metricsUpdateInput.schema';
import { aggregate_daily_app_name_metricsUncheckedUpdateInputObjectSchema } from './objects/aggregate_daily_app_name_metricsUncheckedUpdateInput.schema';

export const aggregate_daily_app_name_metricsUpsertSchema = z.object({
  where: aggregate_daily_app_name_metricsWhereUniqueInputObjectSchema,
  create: z.union([
    aggregate_daily_app_name_metricsCreateInputObjectSchema,
    aggregate_daily_app_name_metricsUncheckedCreateInputObjectSchema,
  ]),
  update: z.union([
    aggregate_daily_app_name_metricsUpdateInputObjectSchema,
    aggregate_daily_app_name_metricsUncheckedUpdateInputObjectSchema,
  ]),
});
