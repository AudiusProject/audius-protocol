import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.playlist_routesCreateInput> = z
  .object({
    slug: z.string(),
    title_slug: z.string(),
    collision_id: z.number(),
    owner_id: z.number(),
    playlist_id: z.number(),
    is_current: z.boolean(),
    blockhash: z.string(),
    blocknumber: z.number(),
    txhash: z.string(),
  })
  .strict();

export const playlist_routesCreateInputObjectSchema = Schema;
