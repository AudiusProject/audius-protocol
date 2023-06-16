import { z } from 'zod';
import { chat_messageCreateManyChat_memberInputObjectSchema } from './chat_messageCreateManyChat_memberInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_messageCreateManyChat_memberInputEnvelope> =
  z
    .object({
      data: z.union([
        z.lazy(() => chat_messageCreateManyChat_memberInputObjectSchema),
        z
          .lazy(() => chat_messageCreateManyChat_memberInputObjectSchema)
          .array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const chat_messageCreateManyChat_memberInputEnvelopeObjectSchema =
  Schema;
