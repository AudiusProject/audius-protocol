import { z } from 'zod';
import { blocksUpdateWithoutGrants_grants_blocknumberToblocksInputObjectSchema } from './blocksUpdateWithoutGrants_grants_blocknumberToblocksInput.schema';
import { blocksUncheckedUpdateWithoutGrants_grants_blocknumberToblocksInputObjectSchema } from './blocksUncheckedUpdateWithoutGrants_grants_blocknumberToblocksInput.schema';
import { blocksCreateWithoutGrants_grants_blocknumberToblocksInputObjectSchema } from './blocksCreateWithoutGrants_grants_blocknumberToblocksInput.schema';
import { blocksUncheckedCreateWithoutGrants_grants_blocknumberToblocksInputObjectSchema } from './blocksUncheckedCreateWithoutGrants_grants_blocknumberToblocksInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.blocksUpsertWithoutGrants_grants_blocknumberToblocksInput> =
  z
    .object({
      update: z.union([
        z.lazy(
          () =>
            blocksUpdateWithoutGrants_grants_blocknumberToblocksInputObjectSchema,
        ),
        z.lazy(
          () =>
            blocksUncheckedUpdateWithoutGrants_grants_blocknumberToblocksInputObjectSchema,
        ),
      ]),
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

export const blocksUpsertWithoutGrants_grants_blocknumberToblocksInputObjectSchema =
  Schema;
