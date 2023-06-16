import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_playlistWhereUniqueInput> = z
  .object({
    playlist_id: z.number().optional(),
  })
  .strict();

export const aggregate_playlistWhereUniqueInputObjectSchema = Schema;
