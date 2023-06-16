import { z } from 'zod';
import { JsonNullValueInputSchema } from '../enums/JsonNullValueInput.schema';

import type { Prisma } from '@prisma/client';

const literalSchema = z.union([z.string(), z.number(), z.boolean()]);
const jsonSchema: z.ZodType<Prisma.InputJsonValue> = z.lazy(() =>
  z.union([
    literalSchema,
    z.array(jsonSchema.nullable()),
    z.record(jsonSchema.nullable()),
  ]),
);

const Schema: z.ZodType<Prisma.playlistsCreateManyInput> = z
  .object({
    blockhash: z.string().optional().nullable(),
    blocknumber: z.number().optional().nullable(),
    playlist_id: z.number(),
    playlist_owner_id: z.number(),
    is_album: z.boolean(),
    is_private: z.boolean(),
    playlist_name: z.string().optional().nullable(),
    playlist_contents: z.union([
      z.lazy(() => JsonNullValueInputSchema),
      jsonSchema,
    ]),
    playlist_image_multihash: z.string().optional().nullable(),
    is_current: z.boolean(),
    is_delete: z.boolean(),
    description: z.string().optional().nullable(),
    created_at: z.coerce.date(),
    upc: z.string().optional().nullable(),
    updated_at: z.coerce.date(),
    playlist_image_sizes_multihash: z.string().optional().nullable(),
    txhash: z.string().optional(),
    last_added_to: z.coerce.date().optional().nullable(),
    slot: z.number().optional().nullable(),
    metadata_multihash: z.string().optional().nullable(),
  })
  .strict();

export const playlistsCreateManyInputObjectSchema = Schema;
