import { z } from 'zod';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { BoolFilterObjectSchema } from './BoolFilter.schema';
import { Enumwallet_chainFilterObjectSchema } from './Enumwallet_chainFilter.schema';
import { wallet_chainSchema } from '../enums/wallet_chain.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.associated_walletsWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => associated_walletsWhereInputObjectSchema),
        z.lazy(() => associated_walletsWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => associated_walletsWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => associated_walletsWhereInputObjectSchema),
        z.lazy(() => associated_walletsWhereInputObjectSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterObjectSchema), z.number()]).optional(),
    user_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    wallet: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    blockhash: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    blocknumber: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    is_current: z
      .union([z.lazy(() => BoolFilterObjectSchema), z.boolean()])
      .optional(),
    is_delete: z
      .union([z.lazy(() => BoolFilterObjectSchema), z.boolean()])
      .optional(),
    chain: z
      .union([
        z.lazy(() => Enumwallet_chainFilterObjectSchema),
        z.lazy(() => wallet_chainSchema),
      ])
      .optional(),
  })
  .strict();

export const associated_walletsWhereInputObjectSchema = Schema;
