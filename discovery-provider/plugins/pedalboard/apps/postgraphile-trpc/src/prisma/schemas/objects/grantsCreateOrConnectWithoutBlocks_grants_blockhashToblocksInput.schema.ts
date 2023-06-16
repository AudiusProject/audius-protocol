import { z } from 'zod';
import { grantsWhereUniqueInputObjectSchema } from './grantsWhereUniqueInput.schema';
import { grantsCreateWithoutBlocks_grants_blockhashToblocksInputObjectSchema } from './grantsCreateWithoutBlocks_grants_blockhashToblocksInput.schema';
import { grantsUncheckedCreateWithoutBlocks_grants_blockhashToblocksInputObjectSchema } from './grantsUncheckedCreateWithoutBlocks_grants_blockhashToblocksInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.grantsCreateOrConnectWithoutBlocks_grants_blockhashToblocksInput> =
  z
    .object({
      where: z.lazy(() => grantsWhereUniqueInputObjectSchema),
      create: z.union([
        z.lazy(
          () =>
            grantsCreateWithoutBlocks_grants_blockhashToblocksInputObjectSchema,
        ),
        z.lazy(
          () =>
            grantsUncheckedCreateWithoutBlocks_grants_blockhashToblocksInputObjectSchema,
        ),
      ]),
    })
    .strict();

export const grantsCreateOrConnectWithoutBlocks_grants_blockhashToblocksInputObjectSchema =
  Schema;
