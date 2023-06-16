import { z } from 'zod';
import { blocksCreateWithoutGrants_grants_blockhashToblocksInputObjectSchema } from './blocksCreateWithoutGrants_grants_blockhashToblocksInput.schema';
import { blocksUncheckedCreateWithoutGrants_grants_blockhashToblocksInputObjectSchema } from './blocksUncheckedCreateWithoutGrants_grants_blockhashToblocksInput.schema';
import { blocksCreateOrConnectWithoutGrants_grants_blockhashToblocksInputObjectSchema } from './blocksCreateOrConnectWithoutGrants_grants_blockhashToblocksInput.schema';
import { blocksUpsertWithoutGrants_grants_blockhashToblocksInputObjectSchema } from './blocksUpsertWithoutGrants_grants_blockhashToblocksInput.schema';
import { blocksWhereUniqueInputObjectSchema } from './blocksWhereUniqueInput.schema';
import { blocksUpdateWithoutGrants_grants_blockhashToblocksInputObjectSchema } from './blocksUpdateWithoutGrants_grants_blockhashToblocksInput.schema';
import { blocksUncheckedUpdateWithoutGrants_grants_blockhashToblocksInputObjectSchema } from './blocksUncheckedUpdateWithoutGrants_grants_blockhashToblocksInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.blocksUpdateOneWithoutGrants_grants_blockhashToblocksNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(
            () =>
              blocksCreateWithoutGrants_grants_blockhashToblocksInputObjectSchema,
          ),
          z.lazy(
            () =>
              blocksUncheckedCreateWithoutGrants_grants_blockhashToblocksInputObjectSchema,
          ),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(
          () =>
            blocksCreateOrConnectWithoutGrants_grants_blockhashToblocksInputObjectSchema,
        )
        .optional(),
      upsert: z
        .lazy(
          () =>
            blocksUpsertWithoutGrants_grants_blockhashToblocksInputObjectSchema,
        )
        .optional(),
      disconnect: z.boolean().optional(),
      delete: z.boolean().optional(),
      connect: z.lazy(() => blocksWhereUniqueInputObjectSchema).optional(),
      update: z
        .union([
          z.lazy(
            () =>
              blocksUpdateWithoutGrants_grants_blockhashToblocksInputObjectSchema,
          ),
          z.lazy(
            () =>
              blocksUncheckedUpdateWithoutGrants_grants_blockhashToblocksInputObjectSchema,
          ),
        ])
        .optional(),
    })
    .strict();

export const blocksUpdateOneWithoutGrants_grants_blockhashToblocksNestedInputObjectSchema =
  Schema;
