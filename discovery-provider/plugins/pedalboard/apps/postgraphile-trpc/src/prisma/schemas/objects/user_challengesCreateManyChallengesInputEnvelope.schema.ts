import { z } from 'zod';
import { user_challengesCreateManyChallengesInputObjectSchema } from './user_challengesCreateManyChallengesInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_challengesCreateManyChallengesInputEnvelope> =
  z
    .object({
      data: z.union([
        z.lazy(() => user_challengesCreateManyChallengesInputObjectSchema),
        z
          .lazy(() => user_challengesCreateManyChallengesInputObjectSchema)
          .array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const user_challengesCreateManyChallengesInputEnvelopeObjectSchema =
  Schema;
