import { z } from 'zod';
import { user_tipsSlotSignatureCompoundUniqueInputObjectSchema } from './user_tipsSlotSignatureCompoundUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_tipsWhereUniqueInput> = z
  .object({
    slot_signature: z
      .lazy(() => user_tipsSlotSignatureCompoundUniqueInputObjectSchema)
      .optional(),
  })
  .strict();

export const user_tipsWhereUniqueInputObjectSchema = Schema;
