import { z } from 'zod';
import { SequelizeMetaCreateInputObjectSchema } from './objects/SequelizeMetaCreateInput.schema';
import { SequelizeMetaUncheckedCreateInputObjectSchema } from './objects/SequelizeMetaUncheckedCreateInput.schema';

export const SequelizeMetaCreateOneSchema = z.object({
  data: z.union([
    SequelizeMetaCreateInputObjectSchema,
    SequelizeMetaUncheckedCreateInputObjectSchema,
  ]),
});
