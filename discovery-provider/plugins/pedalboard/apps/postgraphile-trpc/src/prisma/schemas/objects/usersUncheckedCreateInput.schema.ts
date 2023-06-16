import { z } from 'zod';
import { usersCreatesecondary_idsInputObjectSchema } from './usersCreatesecondary_idsInput.schema';
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

const Schema: z.ZodType<Prisma.usersUncheckedCreateInput> = z
  .object({
    blockhash: z.string().optional().nullable(),
    user_id: z.number(),
    is_current: z.boolean(),
    handle: z.string().optional().nullable(),
    wallet: z.string().optional().nullable(),
    name: z.string().optional().nullable(),
    profile_picture: z.string().optional().nullable(),
    cover_photo: z.string().optional().nullable(),
    bio: z.string().optional().nullable(),
    location: z.string().optional().nullable(),
    metadata_multihash: z.string().optional().nullable(),
    creator_node_endpoint: z.string().optional().nullable(),
    blocknumber: z.number().optional().nullable(),
    is_verified: z.boolean().optional(),
    created_at: z.coerce.date().optional(),
    updated_at: z.coerce.date().optional(),
    handle_lc: z.string().optional().nullable(),
    cover_photo_sizes: z.string().optional().nullable(),
    profile_picture_sizes: z.string().optional().nullable(),
    primary_id: z.number().optional().nullable(),
    secondary_ids: z
      .union([
        z.lazy(() => usersCreatesecondary_idsInputObjectSchema),
        z.number().array(),
      ])
      .optional(),
    replica_set_update_signer: z.string().optional().nullable(),
    has_collectibles: z.boolean().optional(),
    txhash: z.string().optional(),
    playlist_library: z
      .union([z.lazy(() => NullableJsonNullValueInputSchema), jsonSchema])
      .optional(),
    is_deactivated: z.boolean().optional(),
    slot: z.number().optional().nullable(),
    user_storage_account: z.string().optional().nullable(),
    user_authority_account: z.string().optional().nullable(),
    artist_pick_track_id: z.number().optional().nullable(),
    is_available: z.boolean().optional(),
    is_storage_v2: z.boolean().optional(),
    allow_ai_attribution: z.boolean().optional(),
  })
  .strict();

export const usersUncheckedCreateInputObjectSchema = Schema;
