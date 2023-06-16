import { z } from 'zod';
import { SequelizeMetaWhereUniqueInputObjectSchema } from './objects/SequelizeMetaWhereUniqueInput.schema';

export const SequelizeMetaFindUniqueSchema = z.object({
  where: SequelizeMetaWhereUniqueInputObjectSchema,
});
