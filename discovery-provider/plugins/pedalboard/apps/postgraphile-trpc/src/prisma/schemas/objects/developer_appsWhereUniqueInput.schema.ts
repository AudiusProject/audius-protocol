import { z } from 'zod';
import { developer_appsAddressIs_currentTxhashCompoundUniqueInputObjectSchema } from './developer_appsAddressIs_currentTxhashCompoundUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.developer_appsWhereUniqueInput> = z
  .object({
    address_is_current_txhash: z
      .lazy(
        () =>
          developer_appsAddressIs_currentTxhashCompoundUniqueInputObjectSchema,
      )
      .optional(),
  })
  .strict();

export const developer_appsWhereUniqueInputObjectSchema = Schema;
