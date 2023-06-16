import { z } from 'zod';
import { JsonNullValueInputSchema } from '../enums/JsonNullValueInput.schema';
import { NullableJsonNullValueInputSchema } from '../enums/NullableJsonNullValueInput.schema';

import type { Prisma } from '@prisma/client';

const literalSchema = z.union([z.string(), z.number(), z.boolean()]);
const jsonSchema: z.ZodType<Prisma.InputJsonValue> = z.lazy(() =>
  z.union([
    literalSchema,
    z.array(jsonSchema.nullable()),
    z.record(jsonSchema.nullable()),
  ]),
);

const Schema: z.ZodType<Prisma.tracksUncheckedCreateInput> = z
  .object({
    blockhash: z.string().optional().nullable(),
    track_id: z.number(),
    is_current: z.boolean(),
    is_delete: z.boolean(),
    owner_id: z.number(),
    title: z.string().optional().nullable(),
    length: z.number().optional().nullable(),
    cover_art: z.string().optional().nullable(),
    tags: z.string().optional().nullable(),
    genre: z.string().optional().nullable(),
    mood: z.string().optional().nullable(),
    credits_splits: z.string().optional().nullable(),
    create_date: z.string().optional().nullable(),
    release_date: z.string().optional().nullable(),
    file_type: z.string().optional().nullable(),
    metadata_multihash: z.string().optional().nullable(),
    blocknumber: z.number().optional().nullable(),
    track_segments: z.union([
      z.lazy(() => JsonNullValueInputSchema),
      jsonSchema,
    ]),
    created_at: z.coerce.date(),
    description: z.string().optional().nullable(),
    isrc: z.string().optional().nullable(),
    iswc: z.string().optional().nullable(),
    license: z.string().optional().nullable(),
    updated_at: z.coerce.date(),
    cover_art_sizes: z.string().optional().nullable(),
    download: z
      .union([z.lazy(() => NullableJsonNullValueInputSchema), jsonSchema])
      .optional(),
    is_unlisted: z.boolean().optional(),
    field_visibility: z
      .union([z.lazy(() => NullableJsonNullValueInputSchema), jsonSchema])
      .optional(),
    route_id: z.string().optional().nullable(),
    stem_of: z
      .union([z.lazy(() => NullableJsonNullValueInputSchema), jsonSchema])
      .optional(),
    remix_of: z
      .union([z.lazy(() => NullableJsonNullValueInputSchema), jsonSchema])
      .optional(),
    txhash: z.string().optional(),
    slot: z.number().optional().nullable(),
    is_available: z.boolean().optional(),
    is_premium: z.boolean().optional(),
    premium_conditions: z
      .union([z.lazy(() => NullableJsonNullValueInputSchema), jsonSchema])
      .optional(),
    track_cid: z.string().optional().nullable(),
    is_playlist_upload: z.boolean().optional(),
    duration: z.number().optional().nullable(),
    ai_attribution_user_id: z.number().optional().nullable(),
  })
  .strict();

export const tracksUncheckedCreateInputObjectSchema = Schema;
