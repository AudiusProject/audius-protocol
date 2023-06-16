import { z } from 'zod';
import { wallet_chainSchema } from '../enums/wallet_chain.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.NestedEnumwallet_chainFilter> = z
  .object({
    equals: z.lazy(() => wallet_chainSchema).optional(),
    in: z
      .union([
        z.lazy(() => wallet_chainSchema).array(),
        z.lazy(() => wallet_chainSchema),
      ])
      .optional(),
    notIn: z
      .union([
        z.lazy(() => wallet_chainSchema).array(),
        z.lazy(() => wallet_chainSchema),
      ])
      .optional(),
    not: z
      .union([
        z.lazy(() => wallet_chainSchema),
        z.lazy(() => NestedEnumwallet_chainFilterObjectSchema),
      ])
      .optional(),
  })
  .strict();

export const NestedEnumwallet_chainFilterObjectSchema = Schema;
