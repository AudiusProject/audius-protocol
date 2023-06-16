import { z } from 'zod';
import { reposttypeSchema } from '../enums/reposttype.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.EnumreposttypeFieldUpdateOperationsInput> = z
  .object({
    set: z.lazy(() => reposttypeSchema).optional(),
  })
  .strict();

export const EnumreposttypeFieldUpdateOperationsInputObjectSchema = Schema;
