import { z } from 'zod';
import { blocksCreateWithoutGrants_grants_blocknumberToblocksInputObjectSchema } from './blocksCreateWithoutGrants_grants_blocknumberToblocksInput.schema';
import { blocksUncheckedCreateWithoutGrants_grants_blocknumberToblocksInputObjectSchema } from './blocksUncheckedCreateWithoutGrants_grants_blocknumberToblocksInput.schema';
import { blocksCreateOrConnectWithoutGrants_grants_blocknumberToblocksInputObjectSchema } from './blocksCreateOrConnectWithoutGrants_grants_blocknumberToblocksInput.schema';
import { blocksUpsertWithoutGrants_grants_blocknumberToblocksInputObjectSchema } from './blocksUpsertWithoutGrants_grants_blocknumberToblocksInput.schema';
import { blocksWhereUniqueInputObjectSchema } from './blocksWhereUniqueInput.schema';
import { blocksUpdateWithoutGrants_grants_blocknumberToblocksInputObjectSchema } from './blocksUpdateWithoutGrants_grants_blocknumberToblocksInput.schema';
import { blocksUncheckedUpdateWithoutGrants_grants_blocknumberToblocksInputObjectSchema } from './blocksUncheckedUpdateWithoutGrants_grants_blocknumberToblocksInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.blocksUpdateOneWithoutGrants_grants_blocknumberToblocksNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(
            () =>
              blocksCreateWithoutGrants_grants_blocknumberToblocksInputObjectSchema,
          ),
          z.lazy(
            () =>
              blocksUncheckedCreateWithoutGrants_grants_blocknumberToblocksInputObjectSchema,
          ),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(
          () =>
            blocksCreateOrConnectWithoutGrants_grants_blocknumberToblocksInputObjectSchema,
        )
        .optional(),
      upsert: z
        .lazy(
          () =>
            blocksUpsertWithoutGrants_grants_blocknumberToblocksInputObjectSchema,
        )
        .optional(),
      disconnect: z.boolean().optional(),
      delete: z.boolean().optional(),
      connect: z.lazy(() => blocksWhereUniqueInputObjectSchema).optional(),
      update: z
        .union([
          z.lazy(
            () =>
              blocksUpdateWithoutGrants_grants_blocknumberToblocksInputObjectSchema,
          ),
          z.lazy(
            () =>
              blocksUncheckedUpdateWithoutGrants_grants_blocknumberToblocksInputObjectSchema,
          ),
        ])
        .optional(),
    })
    .strict();

export const blocksUpdateOneWithoutGrants_grants_blocknumberToblocksNestedInputObjectSchema =
  Schema;
