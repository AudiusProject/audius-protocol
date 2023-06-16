import { z } from 'zod';

export const PlaylistsScalarFieldEnumSchema = z.enum([
  'blockhash',
  'blocknumber',
  'playlist_id',
  'playlist_owner_id',
  'is_album',
  'is_private',
  'playlist_name',
  'playlist_contents',
  'playlist_image_multihash',
  'is_current',
  'is_delete',
  'description',
  'created_at',
  'upc',
  'updated_at',
  'playlist_image_sizes_multihash',
  'txhash',
  'last_added_to',
  'slot',
  'metadata_multihash',
]);
