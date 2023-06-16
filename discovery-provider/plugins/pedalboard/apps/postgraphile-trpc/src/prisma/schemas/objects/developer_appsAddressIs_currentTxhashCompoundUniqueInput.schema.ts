import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.developer_appsAddressIs_currentTxhashCompoundUniqueInput> =
  z
    .object({
      address: z.string(),
      is_current: z.boolean(),
      txhash: z.string(),
    })
    .strict();

export const developer_appsAddressIs_currentTxhashCompoundUniqueInputObjectSchema =
  Schema;
