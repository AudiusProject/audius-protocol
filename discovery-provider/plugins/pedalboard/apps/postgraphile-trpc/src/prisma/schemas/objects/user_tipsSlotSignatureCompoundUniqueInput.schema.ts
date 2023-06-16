import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_tipsSlotSignatureCompoundUniqueInput> = z
  .object({
    slot: z.number(),
    signature: z.string(),
  })
  .strict();

export const user_tipsSlotSignatureCompoundUniqueInputObjectSchema = Schema;
