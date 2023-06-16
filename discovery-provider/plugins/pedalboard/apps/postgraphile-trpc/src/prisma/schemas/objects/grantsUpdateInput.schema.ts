import { z } from 'zod';
import { StringFieldUpdateOperationsInputObjectSchema } from './StringFieldUpdateOperationsInput.schema';
import { IntFieldUpdateOperationsInputObjectSchema } from './IntFieldUpdateOperationsInput.schema';
import { BoolFieldUpdateOperationsInputObjectSchema } from './BoolFieldUpdateOperationsInput.schema';
import { DateTimeFieldUpdateOperationsInputObjectSchema } from './DateTimeFieldUpdateOperationsInput.schema';
import { blocksUpdateOneWithoutGrants_grants_blockhashToblocksNestedInputObjectSchema } from './blocksUpdateOneWithoutGrants_grants_blockhashToblocksNestedInput.schema';
import { blocksUpdateOneWithoutGrants_grants_blocknumberToblocksNestedInputObjectSchema } from './blocksUpdateOneWithoutGrants_grants_blocknumberToblocksNestedInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.grantsUpdateInput> = z
  .object({
    grantee_address: z
      .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
    user_id: z
      .union([
        z.number(),
        z.lazy(() => IntFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
    is_revoked: z
      .union([
        z.boolean(),
        z.lazy(() => BoolFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
    is_current: z
      .union([
        z.boolean(),
        z.lazy(() => BoolFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
    is_approved: z
      .union([
        z.boolean(),
        z.lazy(() => BoolFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
    updated_at: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
    created_at: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
    txhash: z
      .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
    blocks_grants_blockhashToblocks: z
      .lazy(
        () =>
          blocksUpdateOneWithoutGrants_grants_blockhashToblocksNestedInputObjectSchema,
      )
      .optional(),
    blocks_grants_blocknumberToblocks: z
      .lazy(
        () =>
          blocksUpdateOneWithoutGrants_grants_blocknumberToblocksNestedInputObjectSchema,
      )
      .optional(),
  })
  .strict();

export const grantsUpdateInputObjectSchema = Schema;
