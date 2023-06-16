import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.track_routesUncheckedCreateInput> = z
  .object({
    slug: z.string(),
    title_slug: z.string(),
    collision_id: z.number(),
    owner_id: z.number(),
    track_id: z.number(),
    is_current: z.boolean(),
    blockhash: z.string(),
    blocknumber: z.number(),
    txhash: z.string(),
  })
  .strict();

export const track_routesUncheckedCreateInputObjectSchema = Schema;
