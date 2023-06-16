import { z } from 'zod';
import { IntWithAggregatesFilterObjectSchema } from './IntWithAggregatesFilter.schema';
import { StringWithAggregatesFilterObjectSchema } from './StringWithAggregatesFilter.schema';
import { BoolWithAggregatesFilterObjectSchema } from './BoolWithAggregatesFilter.schema';
import { Enumwallet_chainWithAggregatesFilterObjectSchema } from './Enumwallet_chainWithAggregatesFilter.schema';
import { wallet_chainSchema } from '../enums/wallet_chain.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.associated_walletsScalarWhereWithAggregatesInput> =
  z
    .object({
      AND: z
        .union([
          z.lazy(
            () => associated_walletsScalarWhereWithAggregatesInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                associated_walletsScalarWhereWithAggregatesInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      OR: z
        .lazy(
          () => associated_walletsScalarWhereWithAggregatesInputObjectSchema,
        )
        .array()
        .optional(),
      NOT: z
        .union([
          z.lazy(
            () => associated_walletsScalarWhereWithAggregatesInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                associated_walletsScalarWhereWithAggregatesInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      id: z
        .union([z.lazy(() => IntWithAggregatesFilterObjectSchema), z.number()])
        .optional(),
      user_id: z
        .union([z.lazy(() => IntWithAggregatesFilterObjectSchema), z.number()])
        .optional(),
      wallet: z
        .union([
          z.lazy(() => StringWithAggregatesFilterObjectSchema),
          z.string(),
        ])
        .optional(),
      blockhash: z
        .union([
          z.lazy(() => StringWithAggregatesFilterObjectSchema),
          z.string(),
        ])
        .optional(),
      blocknumber: z
        .union([z.lazy(() => IntWithAggregatesFilterObjectSchema), z.number()])
        .optional(),
      is_current: z
        .union([
          z.lazy(() => BoolWithAggregatesFilterObjectSchema),
          z.boolean(),
        ])
        .optional(),
      is_delete: z
        .union([
          z.lazy(() => BoolWithAggregatesFilterObjectSchema),
          z.boolean(),
        ])
        .optional(),
      chain: z
        .union([
          z.lazy(() => Enumwallet_chainWithAggregatesFilterObjectSchema),
          z.lazy(() => wallet_chainSchema),
        ])
        .optional(),
    })
    .strict();

export const associated_walletsScalarWhereWithAggregatesInputObjectSchema =
  Schema;
