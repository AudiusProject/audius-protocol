import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.notificationCreateuser_idsInput> = z
  .object({
    set: z.number().array(),
  })
  .strict();

export const notificationCreateuser_idsInputObjectSchema = Schema;
