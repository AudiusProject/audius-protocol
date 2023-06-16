import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.ursm_content_nodesCreateproposer_sp_idsInput> = z
  .object({
    set: z.number().array(),
  })
  .strict();

export const ursm_content_nodesCreateproposer_sp_idsInputObjectSchema = Schema;
