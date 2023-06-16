import { z } from 'zod';
import { blocksCreateWithoutGrants_grants_blockhashToblocksInputObjectSchema } from './blocksCreateWithoutGrants_grants_blockhashToblocksInput.schema';
import { blocksUncheckedCreateWithoutGrants_grants_blockhashToblocksInputObjectSchema } from './blocksUncheckedCreateWithoutGrants_grants_blockhashToblocksInput.schema';
import { blocksCreateOrConnectWithoutGrants_grants_blockhashToblocksInputObjectSchema } from './blocksCreateOrConnectWithoutGrants_grants_blockhashToblocksInput.schema';
import { blocksWhereUniqueInputObjectSchema } from './blocksWhereUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.blocksCreateNestedOneWithoutGrants_grants_blockhashToblocksInput> =
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
      connect: z.lazy(() => blocksWhereUniqueInputObjectSchema).optional(),
    })
    .strict();

export const blocksCreateNestedOneWithoutGrants_grants_blockhashToblocksInputObjectSchema =
  Schema;
