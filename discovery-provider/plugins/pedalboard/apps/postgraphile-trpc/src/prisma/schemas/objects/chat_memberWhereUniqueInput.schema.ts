import { z } from 'zod';
import { chat_memberChat_idUser_idCompoundUniqueInputObjectSchema } from './chat_memberChat_idUser_idCompoundUniqueInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_memberWhereUniqueInput> = z
  .object({
    chat_id_user_id: z
      .lazy(() => chat_memberChat_idUser_idCompoundUniqueInputObjectSchema)
      .optional(),
  })
  .strict();

export const chat_memberWhereUniqueInputObjectSchema = Schema;
