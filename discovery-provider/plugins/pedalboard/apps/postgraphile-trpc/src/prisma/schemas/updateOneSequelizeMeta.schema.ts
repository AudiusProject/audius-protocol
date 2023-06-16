import { z } from 'zod';
import { SequelizeMetaUpdateInputObjectSchema } from './objects/SequelizeMetaUpdateInput.schema';
import { SequelizeMetaUncheckedUpdateInputObjectSchema } from './objects/SequelizeMetaUncheckedUpdateInput.schema';
import { SequelizeMetaWhereUniqueInputObjectSchema } from './objects/SequelizeMetaWhereUniqueInput.schema';

export const SequelizeMetaUpdateOneSchema = z.object({
  data: z.union([
    SequelizeMetaUpdateInputObjectSchema,
    SequelizeMetaUncheckedUpdateInputObjectSchema,
  ]),
  where: SequelizeMetaWhereUniqueInputObjectSchema,
});
