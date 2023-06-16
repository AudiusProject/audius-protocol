import { z } from 'zod';
import { StringFieldUpdateOperationsInputObjectSchema } from './StringFieldUpdateOperationsInput.schema';
import { NullableStringFieldUpdateOperationsInputObjectSchema } from './NullableStringFieldUpdateOperationsInput.schema';
import { NullableBoolFieldUpdateOperationsInputObjectSchema } from './NullableBoolFieldUpdateOperationsInput.schema';
import { NullableIntFieldUpdateOperationsInputObjectSchema } from './NullableIntFieldUpdateOperationsInput.schema';
import { developer_appsUpdateManyWithoutBlocks_developer_apps_blockhashToblocksNestedInputObjectSchema } from './developer_appsUpdateManyWithoutBlocks_developer_apps_blockhashToblocksNestedInput.schema';
import { developer_appsUpdateManyWithoutBlocks_developer_apps_blocknumberToblocksNestedInputObjectSchema } from './developer_appsUpdateManyWithoutBlocks_developer_apps_blocknumberToblocksNestedInput.schema';
import { grantsUpdateManyWithoutBlocks_grants_blockhashToblocksNestedInputObjectSchema } from './grantsUpdateManyWithoutBlocks_grants_blockhashToblocksNestedInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.blocksUpdateWithoutGrants_grants_blocknumberToblocksInput> =
  z
    .object({
      blockhash: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputObjectSchema),
        ])
        .optional(),
      parenthash: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputObjectSchema),
        ])
        .optional()
        .nullable(),
      is_current: z
        .union([
          z.boolean(),
          z.lazy(() => NullableBoolFieldUpdateOperationsInputObjectSchema),
        ])
        .optional()
        .nullable(),
      number: z
        .union([
          z.number(),
          z.lazy(() => NullableIntFieldUpdateOperationsInputObjectSchema),
        ])
        .optional()
        .nullable(),
      developer_apps_developer_apps_blockhashToblocks: z
        .lazy(
          () =>
            developer_appsUpdateManyWithoutBlocks_developer_apps_blockhashToblocksNestedInputObjectSchema,
        )
        .optional(),
      developer_apps_developer_apps_blocknumberToblocks: z
        .lazy(
          () =>
            developer_appsUpdateManyWithoutBlocks_developer_apps_blocknumberToblocksNestedInputObjectSchema,
        )
        .optional(),
      grants_grants_blockhashToblocks: z
        .lazy(
          () =>
            grantsUpdateManyWithoutBlocks_grants_blockhashToblocksNestedInputObjectSchema,
        )
        .optional(),
    })
    .strict();

export const blocksUpdateWithoutGrants_grants_blocknumberToblocksInputObjectSchema =
  Schema;
