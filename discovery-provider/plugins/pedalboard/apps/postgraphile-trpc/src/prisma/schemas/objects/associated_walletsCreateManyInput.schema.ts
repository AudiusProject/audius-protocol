import { z } from 'zod';
import { wallet_chainSchema } from '../enums/wallet_chain.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.associated_walletsCreateManyInput> = z
  .object({
    id: z.number().optional(),
    user_id: z.number(),
    wallet: z.string(),
    blockhash: z.string(),
    blocknumber: z.number(),
    is_current: z.boolean(),
    is_delete: z.boolean(),
    chain: z.lazy(() => wallet_chainSchema),
  })
  .strict();

export const associated_walletsCreateManyInputObjectSchema = Schema;
