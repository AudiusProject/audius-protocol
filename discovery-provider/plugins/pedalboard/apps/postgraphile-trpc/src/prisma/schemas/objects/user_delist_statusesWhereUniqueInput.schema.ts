import { z } from 'zod';
import { user_delist_statusesCreated_atUser_idDelistedCompoundUniqueInputObjectSchema } from './user_delist_statusesCreated_atUser_idDelistedCompoundUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_delist_statusesWhereUniqueInput> = z
  .object({
    created_at_user_id_delisted: z
      .lazy(
        () =>
          user_delist_statusesCreated_atUser_idDelistedCompoundUniqueInputObjectSchema,
      )
      .optional(),
  })
  .strict();

export const user_delist_statusesWhereUniqueInputObjectSchema = Schema;
