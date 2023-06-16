import { z } from 'zod';
import { blocksWhereUniqueInputObjectSchema } from './blocksWhereUniqueInput.schema';
import { blocksCreateWithoutGrants_grants_blocknumberToblocksInputObjectSchema } from './blocksCreateWithoutGrants_grants_blocknumberToblocksInput.schema';
import { blocksUncheckedCreateWithoutGrants_grants_blocknumberToblocksInputObjectSchema } from './blocksUncheckedCreateWithoutGrants_grants_blocknumberToblocksInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.blocksCreateOrConnectWithoutGrants_grants_blocknumberToblocksInput> =
  z
    .object({
      where: z.lazy(() => blocksWhereUniqueInputObjectSchema),
      create: z.union([
        z.lazy(
          () =>
            blocksCreateWithoutGrants_grants_blocknumberToblocksInputObjectSchema,
        ),
        z.lazy(
          () =>
            blocksUncheckedCreateWithoutGrants_grants_blocknumberToblocksInputObjectSchema,
        ),
      ]),
    })
    .strict();

export const blocksCreateOrConnectWithoutGrants_grants_blocknumberToblocksInputObjectSchema =
  Schema;
