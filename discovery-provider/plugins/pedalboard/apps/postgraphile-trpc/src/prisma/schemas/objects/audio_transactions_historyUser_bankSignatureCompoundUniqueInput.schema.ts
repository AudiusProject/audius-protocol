import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.audio_transactions_historyUser_bankSignatureCompoundUniqueInput> =
  z
    .object({
      user_bank: z.string(),
      signature: z.string(),
    })
    .strict();

export const audio_transactions_historyUser_bankSignatureCompoundUniqueInputObjectSchema =
  Schema;
