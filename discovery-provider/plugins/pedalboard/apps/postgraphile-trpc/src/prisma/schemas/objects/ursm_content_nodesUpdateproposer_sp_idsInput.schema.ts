import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.ursm_content_nodesUpdateproposer_sp_idsInput> = z
  .object({
    set: z.number().array().optional(),
    push: z.union([z.number(), z.number().array()]).optional(),
  })
  .strict();

export const ursm_content_nodesUpdateproposer_sp_idsInputObjectSchema = Schema;
