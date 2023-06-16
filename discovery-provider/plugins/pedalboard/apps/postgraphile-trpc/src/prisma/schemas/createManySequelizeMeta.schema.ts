import { z } from 'zod';
import { SequelizeMetaCreateManyInputObjectSchema } from './objects/SequelizeMetaCreateManyInput.schema';

export const SequelizeMetaCreateManySchema = z.object({
  data: z.union([
    SequelizeMetaCreateManyInputObjectSchema,
    z.array(SequelizeMetaCreateManyInputObjectSchema),
  ]),
  skipDuplicates: z.boolean().optional(),
});
