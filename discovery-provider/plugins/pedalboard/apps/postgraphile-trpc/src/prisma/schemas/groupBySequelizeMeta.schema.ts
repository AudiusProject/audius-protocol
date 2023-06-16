import { z } from 'zod';
import { SequelizeMetaWhereInputObjectSchema } from './objects/SequelizeMetaWhereInput.schema';
import { SequelizeMetaOrderByWithAggregationInputObjectSchema } from './objects/SequelizeMetaOrderByWithAggregationInput.schema';
import { SequelizeMetaScalarWhereWithAggregatesInputObjectSchema } from './objects/SequelizeMetaScalarWhereWithAggregatesInput.schema';
import { SequelizeMetaScalarFieldEnumSchema } from './enums/SequelizeMetaScalarFieldEnum.schema';

export const SequelizeMetaGroupBySchema = z.object({
  where: SequelizeMetaWhereInputObjectSchema.optional(),
  orderBy: z
    .union([
      SequelizeMetaOrderByWithAggregationInputObjectSchema,
      SequelizeMetaOrderByWithAggregationInputObjectSchema.array(),
    ])
    .optional(),
  having: SequelizeMetaScalarWhereWithAggregatesInputObjectSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  by: z.array(SequelizeMetaScalarFieldEnumSchema),
});
