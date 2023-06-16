import { z } from 'zod';
import { chat_memberCreateManyChatInputObjectSchema } from './chat_memberCreateManyChatInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_memberCreateManyChatInputEnvelope> = z
  .object({
    data: z.union([
      z.lazy(() => chat_memberCreateManyChatInputObjectSchema),
      z.lazy(() => chat_memberCreateManyChatInputObjectSchema).array(),
    ]),
    skipDuplicates: z.boolean().optional(),
  })
  .strict();

export const chat_memberCreateManyChatInputEnvelopeObjectSchema = Schema;
