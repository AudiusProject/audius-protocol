import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_memberChat_idUser_idCompoundUniqueInput> = z
  .object({
    chat_id: z.string(),
    user_id: z.number(),
  })
  .strict();

export const chat_memberChat_idUser_idCompoundUniqueInputObjectSchema = Schema;
