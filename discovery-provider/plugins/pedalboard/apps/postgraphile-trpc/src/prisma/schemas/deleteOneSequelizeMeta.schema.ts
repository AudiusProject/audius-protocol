import { z } from 'zod';
import { SequelizeMetaWhereUniqueInputObjectSchema } from './objects/SequelizeMetaWhereUniqueInput.schema';

export const SequelizeMetaDeleteOneSchema = z.object({
  where: SequelizeMetaWhereUniqueInputObjectSchema,
});
