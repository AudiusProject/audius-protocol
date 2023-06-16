import { z } from 'zod';
import { blocksCreateWithoutGrants_grants_blocknumberToblocksInputObjectSchema } from './blocksCreateWithoutGrants_grants_blocknumberToblocksInput.schema';
import { blocksUncheckedCreateWithoutGrants_grants_blocknumberToblocksInputObjectSchema } from './blocksUncheckedCreateWithoutGrants_grants_blocknumberToblocksInput.schema';
import { blocksCreateOrConnectWithoutGrants_grants_blocknumberToblocksInputObjectSchema } from './blocksCreateOrConnectWithoutGrants_grants_blocknumberToblocksInput.schema';
import { blocksWhereUniqueInputObjectSchema } from './blocksWhereUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.blocksCreateNestedOneWithoutGrants_grants_blocknumberToblocksInput> =
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
      connect: z.lazy(() => blocksWhereUniqueInputObjectSchema).optional(),
    })
    .strict();

export const blocksCreateNestedOneWithoutGrants_grants_blocknumberToblocksInputObjectSchema =
  Schema;
