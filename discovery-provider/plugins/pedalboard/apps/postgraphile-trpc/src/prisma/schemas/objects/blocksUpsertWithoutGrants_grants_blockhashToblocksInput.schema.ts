import { z } from 'zod';
import { blocksUpdateWithoutGrants_grants_blockhashToblocksInputObjectSchema } from './blocksUpdateWithoutGrants_grants_blockhashToblocksInput.schema';
import { blocksUncheckedUpdateWithoutGrants_grants_blockhashToblocksInputObjectSchema } from './blocksUncheckedUpdateWithoutGrants_grants_blockhashToblocksInput.schema';
import { blocksCreateWithoutGrants_grants_blockhashToblocksInputObjectSchema } from './blocksCreateWithoutGrants_grants_blockhashToblocksInput.schema';
import { blocksUncheckedCreateWithoutGrants_grants_blockhashToblocksInputObjectSchema } from './blocksUncheckedCreateWithoutGrants_grants_blockhashToblocksInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.blocksUpsertWithoutGrants_grants_blockhashToblocksInput> =
  z
    .object({
      update: z.union([
        z.lazy(
          () =>
            blocksUpdateWithoutGrants_grants_blockhashToblocksInputObjectSchema,
        ),
        z.lazy(
          () =>
            blocksUncheckedUpdateWithoutGrants_grants_blockhashToblocksInputObjectSchema,
        ),
      ]),
      create: z.union([
        z.lazy(
          () =>
            blocksCreateWithoutGrants_grants_blockhashToblocksInputObjectSchema,
        ),
        z.lazy(
          () =>
            blocksUncheckedCreateWithoutGrants_grants_blockhashToblocksInputObjectSchema,
        ),
      ]),
    })
    .strict();

export const blocksUpsertWithoutGrants_grants_blockhashToblocksInputObjectSchema =
  Schema;
