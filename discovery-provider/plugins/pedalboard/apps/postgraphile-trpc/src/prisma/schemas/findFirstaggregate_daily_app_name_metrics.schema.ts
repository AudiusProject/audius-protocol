import { z } from 'zod';
import { aggregate_daily_app_name_metricsOrderByWithRelationInputObjectSchema } from './objects/aggregate_daily_app_name_metricsOrderByWithRelationInput.schema';
import { aggregate_daily_app_name_metricsWhereInputObjectSchema } from './objects/aggregate_daily_app_name_metricsWhereInput.schema';
import { aggregate_daily_app_name_metricsWhereUniqueInputObjectSchema } from './objects/aggregate_daily_app_name_metricsWhereUniqueInput.schema';
import { aggregate_daily_app_name_metricsScalarFieldEnumSchema } from './enums/aggregate_daily_app_name_metricsScalarFieldEnum.schema';

export const aggregate_daily_app_name_metricsFindFirstSchema = z.object({
  orderBy: z
    .union([
      aggregate_daily_app_name_metricsOrderByWithRelationInputObjectSchema,
      aggregate_daily_app_name_metricsOrderByWithRelationInputObjectSchema.array(),
    ])
    .optional(),
  where: aggregate_daily_app_name_metricsWhereInputObjectSchema.optional(),
  cursor:
    aggregate_daily_app_name_metricsWhereUniqueInputObjectSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z
    .array(aggregate_daily_app_name_metricsScalarFieldEnumSchema)
    .optional(),
});
