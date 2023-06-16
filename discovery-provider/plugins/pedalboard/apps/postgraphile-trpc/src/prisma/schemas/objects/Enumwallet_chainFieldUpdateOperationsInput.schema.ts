import { z } from 'zod';
import { wallet_chainSchema } from '../enums/wallet_chain.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Enumwallet_chainFieldUpdateOperationsInput> = z
  .object({
    set: z.lazy(() => wallet_chainSchema).optional(),
  })
  .strict();

export const Enumwallet_chainFieldUpdateOperationsInputObjectSchema = Schema;
