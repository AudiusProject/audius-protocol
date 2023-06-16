import { z } from 'zod';
import { SequelizeMetaWhereInputObjectSchema } from './objects/SequelizeMetaWhereInput.schema';

export const SequelizeMetaDeleteManySchema = z.object({
  where: SequelizeMetaWhereInputObjectSchema.optional(),
});
