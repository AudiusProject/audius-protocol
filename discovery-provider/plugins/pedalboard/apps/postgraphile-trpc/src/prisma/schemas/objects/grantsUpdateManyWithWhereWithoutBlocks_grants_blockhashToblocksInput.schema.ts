import { z } from 'zod';
import { grantsScalarWhereInputObjectSchema } from './grantsScalarWhereInput.schema';
import { grantsUpdateManyMutationInputObjectSchema } from './grantsUpdateManyMutationInput.schema';
import { grantsUncheckedUpdateManyWithoutGrants_grants_blockhashToblocksInputObjectSchema } from './grantsUncheckedUpdateManyWithoutGrants_grants_blockhashToblocksInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.grantsUpdateManyWithWhereWithoutBlocks_grants_blockhashToblocksInput> =
  z
    .object({
      where: z.lazy(() => grantsScalarWhereInputObjectSchema),
      data: z.union([
        z.lazy(() => grantsUpdateManyMutationInputObjectSchema),
        z.lazy(
          () =>
            grantsUncheckedUpdateManyWithoutGrants_grants_blockhashToblocksInputObjectSchema,
        ),
      ]),
    })
    .strict();

export const grantsUpdateManyWithWhereWithoutBlocks_grants_blockhashToblocksInputObjectSchema =
  Schema;
