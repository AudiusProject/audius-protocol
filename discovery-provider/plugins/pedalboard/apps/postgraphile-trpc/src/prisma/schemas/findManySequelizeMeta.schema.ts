import { z } from 'zod';
import { SequelizeMetaOrderByWithRelationInputObjectSchema } from './objects/SequelizeMetaOrderByWithRelationInput.schema';
import { SequelizeMetaWhereInputObjectSchema } from './objects/SequelizeMetaWhereInput.schema';
import { SequelizeMetaWhereUniqueInputObjectSchema } from './objects/SequelizeMetaWhereUniqueInput.schema';
import { SequelizeMetaScalarFieldEnumSchema } from './enums/SequelizeMetaScalarFieldEnum.schema';

export const SequelizeMetaFindManySchema = z.object({
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
  distinct: z.array(SequelizeMetaScalarFieldEnumSchema).optional(),
});
