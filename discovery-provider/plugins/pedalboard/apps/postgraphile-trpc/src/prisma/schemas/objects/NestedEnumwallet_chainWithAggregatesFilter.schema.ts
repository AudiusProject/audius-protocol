import { z } from 'zod';
import { wallet_chainSchema } from '../enums/wallet_chain.schema';
import { NestedIntFilterObjectSchema } from './NestedIntFilter.schema';
import { NestedEnumwallet_chainFilterObjectSchema } from './NestedEnumwallet_chainFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.NestedEnumwallet_chainWithAggregatesFilter> = z
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
        z.lazy(() => NestedEnumwallet_chainWithAggregatesFilterObjectSchema),
      ])
      .optional(),
    _count: z.lazy(() => NestedIntFilterObjectSchema).optional(),
    _min: z.lazy(() => NestedEnumwallet_chainFilterObjectSchema).optional(),
    _max: z.lazy(() => NestedEnumwallet_chainFilterObjectSchema).optional(),
  })
  .strict();

export const NestedEnumwallet_chainWithAggregatesFilterObjectSchema = Schema;
