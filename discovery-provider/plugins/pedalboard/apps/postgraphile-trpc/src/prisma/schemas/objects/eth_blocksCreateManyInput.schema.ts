import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.eth_blocksCreateManyInput> = z
  .object({
    last_scanned_block: z.number().optional(),
    created_at: z.coerce.date().optional(),
    updated_at: z.coerce.date().optional(),
  })
  .strict();

export const eth_blocksCreateManyInputObjectSchema = Schema;
