import { z } from 'zod';

export const Challenge_profile_completionScalarFieldEnumSchema = z.enum([
  'user_id',
  'profile_description',
  'profile_name',
  'profile_picture',
  'profile_cover_photo',
  'follows',
  'favorites',
  'reposts',
]);
