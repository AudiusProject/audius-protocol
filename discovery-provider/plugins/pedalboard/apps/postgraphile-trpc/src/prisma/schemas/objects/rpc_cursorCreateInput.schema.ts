import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.rpc_cursorCreateInput> = z
  .object({
    relayed_by: z.string(),
    relayed_at: z.coerce.date(),
  })
  .strict();

export const rpc_cursorCreateInputObjectSchema = Schema;
