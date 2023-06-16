import { z } from 'zod';
import { IntFieldUpdateOperationsInputObjectSchema } from './IntFieldUpdateOperationsInput.schema';
import { NullableBigIntFieldUpdateOperationsInputObjectSchema } from './NullableBigIntFieldUpdateOperationsInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_userUncheckedUpdateInput> = z
  .object({
    user_id: z
      .union([
        z.number(),
        z.lazy(() => IntFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
    track_count: z
      .union([
        z.bigint(),
        z.lazy(() => NullableBigIntFieldUpdateOperationsInputObjectSchema),
      ])
      .optional()
      .nullable(),
    playlist_count: z
      .union([
        z.bigint(),
        z.lazy(() => NullableBigIntFieldUpdateOperationsInputObjectSchema),
      ])
      .optional()
      .nullable(),
    album_count: z
      .union([
        z.bigint(),
        z.lazy(() => NullableBigIntFieldUpdateOperationsInputObjectSchema),
      ])
      .optional()
      .nullable(),
    follower_count: z
      .union([
        z.bigint(),
        z.lazy(() => NullableBigIntFieldUpdateOperationsInputObjectSchema),
      ])
      .optional()
      .nullable(),
    following_count: z
      .union([
        z.bigint(),
        z.lazy(() => NullableBigIntFieldUpdateOperationsInputObjectSchema),
      ])
      .optional()
      .nullable(),
    repost_count: z
      .union([
        z.bigint(),
        z.lazy(() => NullableBigIntFieldUpdateOperationsInputObjectSchema),
      ])
      .optional()
      .nullable(),
    track_save_count: z
      .union([
        z.bigint(),
        z.lazy(() => NullableBigIntFieldUpdateOperationsInputObjectSchema),
      ])
      .optional()
      .nullable(),
    supporter_count: z
      .union([
        z.number(),
        z.lazy(() => IntFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
    supporting_count: z
      .union([
        z.number(),
        z.lazy(() => IntFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
  })
  .strict();

export const aggregate_userUncheckedUpdateInputObjectSchema = Schema;
