import { z } from 'zod';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { IntFilterObjectSchema } from './IntFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.challenge_disbursementsWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => challenge_disbursementsWhereInputObjectSchema),
        z.lazy(() => challenge_disbursementsWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => challenge_disbursementsWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => challenge_disbursementsWhereInputObjectSchema),
        z.lazy(() => challenge_disbursementsWhereInputObjectSchema).array(),
      ])
      .optional(),
    challenge_id: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    user_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    specifier: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    signature: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    slot: z.union([z.lazy(() => IntFilterObjectSchema), z.number()]).optional(),
    amount: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
  })
  .strict();

export const challenge_disbursementsWhereInputObjectSchema = Schema;
