import { z } from 'zod';
import { grantsWhereUniqueInputObjectSchema } from './grantsWhereUniqueInput.schema';
import { grantsUpdateWithoutBlocks_grants_blockhashToblocksInputObjectSchema } from './grantsUpdateWithoutBlocks_grants_blockhashToblocksInput.schema';
import { grantsUncheckedUpdateWithoutBlocks_grants_blockhashToblocksInputObjectSchema } from './grantsUncheckedUpdateWithoutBlocks_grants_blockhashToblocksInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.grantsUpdateWithWhereUniqueWithoutBlocks_grants_blockhashToblocksInput> =
  z
    .object({
      where: z.lazy(() => grantsWhereUniqueInputObjectSchema),
      data: z.union([
        z.lazy(
          () =>
            grantsUpdateWithoutBlocks_grants_blockhashToblocksInputObjectSchema,
        ),
        z.lazy(
          () =>
            grantsUncheckedUpdateWithoutBlocks_grants_blockhashToblocksInputObjectSchema,
        ),
      ]),
    })
    .strict();

export const grantsUpdateWithWhereUniqueWithoutBlocks_grants_blockhashToblocksInputObjectSchema =
  Schema;
