import { z } from 'zod';
import { challengesCreateNestedOneWithoutUser_challengesInputObjectSchema } from './challengesCreateNestedOneWithoutUser_challengesInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_challengesCreateInput> = z
  .object({
    user_id: z.number(),
    specifier: z.string(),
    is_complete: z.boolean(),
    current_step_count: z.number().optional().nullable(),
    completed_blocknumber: z.number().optional().nullable(),
    challenges: z.lazy(
      () => challengesCreateNestedOneWithoutUser_challengesInputObjectSchema,
    ),
  })
  .strict();

export const user_challengesCreateInputObjectSchema = Schema;
