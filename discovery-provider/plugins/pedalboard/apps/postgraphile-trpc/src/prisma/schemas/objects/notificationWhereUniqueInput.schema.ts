import { z } from 'zod';
import { notificationGroup_idSpecifierCompoundUniqueInputObjectSchema } from './notificationGroup_idSpecifierCompoundUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.notificationWhereUniqueInput> = z
  .object({
    id: z.number().optional(),
    group_id_specifier: z
      .lazy(() => notificationGroup_idSpecifierCompoundUniqueInputObjectSchema)
      .optional(),
  })
  .strict();

export const notificationWhereUniqueInputObjectSchema = Schema;
