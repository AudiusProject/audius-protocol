import { z } from 'zod';
import { SequelizeMetaUpdateManyMutationInputObjectSchema } from './objects/SequelizeMetaUpdateManyMutationInput.schema';
import { SequelizeMetaWhereInputObjectSchema } from './objects/SequelizeMetaWhereInput.schema';

export const SequelizeMetaUpdateManySchema = z.object({
  data: SequelizeMetaUpdateManyMutationInputObjectSchema,
  where: SequelizeMetaWhereInputObjectSchema.optional(),
});
