import { z } from 'zod';
import { audio_transactions_historyUser_bankSignatureCompoundUniqueInputObjectSchema } from './audio_transactions_historyUser_bankSignatureCompoundUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.audio_transactions_historyWhereUniqueInput> = z
  .object({
    user_bank_signature: z
      .lazy(
        () =>
          audio_transactions_historyUser_bankSignatureCompoundUniqueInputObjectSchema,
      )
      .optional(),
  })
  .strict();

export const audio_transactions_historyWhereUniqueInputObjectSchema = Schema;
