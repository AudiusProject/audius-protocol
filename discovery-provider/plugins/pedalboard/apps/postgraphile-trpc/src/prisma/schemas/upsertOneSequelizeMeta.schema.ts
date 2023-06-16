import { z } from 'zod';
import { SequelizeMetaWhereUniqueInputObjectSchema } from './objects/SequelizeMetaWhereUniqueInput.schema';
import { SequelizeMetaCreateInputObjectSchema } from './objects/SequelizeMetaCreateInput.schema';
import { SequelizeMetaUncheckedCreateInputObjectSchema } from './objects/SequelizeMetaUncheckedCreateInput.schema';
import { SequelizeMetaUpdateInputObjectSchema } from './objects/SequelizeMetaUpdateInput.schema';
import { SequelizeMetaUncheckedUpdateInputObjectSchema } from './objects/SequelizeMetaUncheckedUpdateInput.schema';

export const SequelizeMetaUpsertSchema = z.object({
  where: SequelizeMetaWhereUniqueInputObjectSchema,
  create: z.union([
    SequelizeMetaCreateInputObjectSchema,
    SequelizeMetaUncheckedCreateInputObjectSchema,
  ]),
  update: z.union([
    SequelizeMetaUpdateInputObjectSchema,
    SequelizeMetaUncheckedUpdateInputObjectSchema,
  ]),
});
