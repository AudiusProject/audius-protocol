import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.eth_blocksWhereUniqueInput> = z
  .object({
    last_scanned_block: z.number().optional(),
  })
  .strict();

export const eth_blocksWhereUniqueInputObjectSchema = Schema;
