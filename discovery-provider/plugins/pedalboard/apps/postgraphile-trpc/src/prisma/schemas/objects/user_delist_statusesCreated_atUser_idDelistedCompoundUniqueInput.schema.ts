import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_delist_statusesCreated_atUser_idDelistedCompoundUniqueInput> =
  z
    .object({
      created_at: z.coerce.date(),
      user_id: z.number(),
      delisted: z.boolean(),
    })
    .strict();

export const user_delist_statusesCreated_atUser_idDelistedCompoundUniqueInputObjectSchema =
  Schema;
