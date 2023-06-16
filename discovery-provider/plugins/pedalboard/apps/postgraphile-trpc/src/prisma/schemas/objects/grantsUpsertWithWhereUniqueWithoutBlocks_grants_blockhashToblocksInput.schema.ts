import { z } from 'zod';
import { grantsWhereUniqueInputObjectSchema } from './grantsWhereUniqueInput.schema';
import { grantsUpdateWithoutBlocks_grants_blockhashToblocksInputObjectSchema } from './grantsUpdateWithoutBlocks_grants_blockhashToblocksInput.schema';
import { grantsUncheckedUpdateWithoutBlocks_grants_blockhashToblocksInputObjectSchema } from './grantsUncheckedUpdateWithoutBlocks_grants_blockhashToblocksInput.schema';
import { grantsCreateWithoutBlocks_grants_blockhashToblocksInputObjectSchema } from './grantsCreateWithoutBlocks_grants_blockhashToblocksInput.schema';
import { grantsUncheckedCreateWithoutBlocks_grants_blockhashToblocksInputObjectSchema } from './grantsUncheckedCreateWithoutBlocks_grants_blockhashToblocksInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.grantsUpsertWithWhereUniqueWithoutBlocks_grants_blockhashToblocksInput> =
  z
    .object({
      where: z.lazy(() => grantsWhereUniqueInputObjectSchema),
      update: z.union([
        z.lazy(
          () =>
            grantsUpdateWithoutBlocks_grants_blockhashToblocksInputObjectSchema,
        ),
        z.lazy(
          () =>
            grantsUncheckedUpdateWithoutBlocks_grants_blockhashToblocksInputObjectSchema,
        ),
      ]),
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

export const grantsUpsertWithWhereUniqueWithoutBlocks_grants_blockhashToblocksInputObjectSchema =
  Schema;
