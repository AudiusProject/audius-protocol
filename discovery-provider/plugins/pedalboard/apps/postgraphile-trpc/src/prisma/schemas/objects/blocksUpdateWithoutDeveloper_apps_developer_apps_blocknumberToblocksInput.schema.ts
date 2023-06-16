import { z } from 'zod';
import { StringFieldUpdateOperationsInputObjectSchema } from './StringFieldUpdateOperationsInput.schema';
import { NullableStringFieldUpdateOperationsInputObjectSchema } from './NullableStringFieldUpdateOperationsInput.schema';
import { NullableBoolFieldUpdateOperationsInputObjectSchema } from './NullableBoolFieldUpdateOperationsInput.schema';
import { NullableIntFieldUpdateOperationsInputObjectSchema } from './NullableIntFieldUpdateOperationsInput.schema';
import { developer_appsUpdateManyWithoutBlocks_developer_apps_blockhashToblocksNestedInputObjectSchema } from './developer_appsUpdateManyWithoutBlocks_developer_apps_blockhashToblocksNestedInput.schema';
import { grantsUpdateManyWithoutBlocks_grants_blockhashToblocksNestedInputObjectSchema } from './grantsUpdateManyWithoutBlocks_grants_blockhashToblocksNestedInput.schema';
import { grantsUpdateManyWithoutBlocks_grants_blocknumberToblocksNestedInputObjectSchema } from './grantsUpdateManyWithoutBlocks_grants_blocknumberToblocksNestedInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.blocksUpdateWithoutDeveloper_apps_developer_apps_blocknumberToblocksInput> =
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
      grants_grants_blockhashToblocks: z
        .lazy(
          () =>
            grantsUpdateManyWithoutBlocks_grants_blockhashToblocksNestedInputObjectSchema,
        )
        .optional(),
      grants_grants_blocknumberToblocks: z
        .lazy(
          () =>
            grantsUpdateManyWithoutBlocks_grants_blocknumberToblocksNestedInputObjectSchema,
        )
        .optional(),
    })
    .strict();

export const blocksUpdateWithoutDeveloper_apps_developer_apps_blocknumberToblocksInputObjectSchema =
  Schema;
