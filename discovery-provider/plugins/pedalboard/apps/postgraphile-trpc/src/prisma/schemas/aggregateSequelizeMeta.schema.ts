import { z } from 'zod';
import { SequelizeMetaOrderByWithRelationInputObjectSchema } from './objects/SequelizeMetaOrderByWithRelationInput.schema';
import { SequelizeMetaWhereInputObjectSchema } from './objects/SequelizeMetaWhereInput.schema';
import { SequelizeMetaWhereUniqueInputObjectSchema } from './objects/SequelizeMetaWhereUniqueInput.schema';
import { SequelizeMetaCountAggregateInputObjectSchema } from './objects/SequelizeMetaCountAggregateInput.schema';
import { SequelizeMetaMinAggregateInputObjectSchema } from './objects/SequelizeMetaMinAggregateInput.schema';
import { SequelizeMetaMaxAggregateInputObjectSchema } from './objects/SequelizeMetaMaxAggregateInput.schema';

export const SequelizeMetaAggregateSchema = z.object({
  orderBy: z
    .union([
      SequelizeMetaOrderByWithRelationInputObjectSchema,
      SequelizeMetaOrderByWithRelationInputObjectSchema.array(),
    ])
    .optional(),
  where: SequelizeMetaWhereInputObjectSchema.optional(),
  cursor: SequelizeMetaWhereUniqueInputObjectSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  _count: z
    .union([z.literal(true), SequelizeMetaCountAggregateInputObjectSchema])
    .optional(),
  _min: SequelizeMetaMinAggregateInputObjectSchema.optional(),
  _max: SequelizeMetaMaxAggregateInputObjectSchema.optional(),
});
