import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.notificationGroup_idSpecifierCompoundUniqueInput> =
  z
    .object({
      group_id: z.string(),
      specifier: z.string(),
    })
    .strict();

export const notificationGroup_idSpecifierCompoundUniqueInputObjectSchema =
  Schema;
