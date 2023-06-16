import { z } from 'zod';
import { blocksWhereUniqueInputObjectSchema } from './blocksWhereUniqueInput.schema';
import { blocksCreateWithoutGrants_grants_blockhashToblocksInputObjectSchema } from './blocksCreateWithoutGrants_grants_blockhashToblocksInput.schema';
import { blocksUncheckedCreateWithoutGrants_grants_blockhashToblocksInputObjectSchema } from './blocksUncheckedCreateWithoutGrants_grants_blockhashToblocksInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.blocksCreateOrConnectWithoutGrants_grants_blockhashToblocksInput> =
  z
    .object({
      where: z.lazy(() => blocksWhereUniqueInputObjectSchema),
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

export const blocksCreateOrConnectWithoutGrants_grants_blockhashToblocksInputObjectSchema =
  Schema;
