import { z } from 'zod';
import { challengetypeSchema } from '../enums/challengetype.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.challengesCreateWithoutUser_challengesInput> = z
  .object({
    id: z.string(),
    type: z.lazy(() => challengetypeSchema),
    amount: z.string(),
    active: z.boolean(),
    step_count: z.number().optional().nullable(),
    starting_block: z.number().optional().nullable(),
  })
  .strict();

export const challengesCreateWithoutUser_challengesInputObjectSchema = Schema;
