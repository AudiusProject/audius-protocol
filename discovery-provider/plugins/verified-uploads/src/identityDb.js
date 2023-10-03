const onSocialMediaUpdateFunction = `
  CREATE OR REPLACE FUNCTION public.on_social_media_update()
  RETURNS trigger
  LANGUAGE plpgsql
  AS $function$
  begin
    case TG_TABLE_NAME
      when 'InstagramUsers' then
        PERFORM pg_notify('social_media_update', json_build_object('platform', 'instagram', 'user_id', new.blockchainUserId, 'old_verified_status', old.verified, 'new_verified_status', new.verified)::text);
      when 'TikTokUsers' then
        PERFORM pg_notify('social_media_update', json_build_object('platform', 'tiktok', 'user_id', new.blockchainUserId, 'old_verified_status', old.verified, 'new_verified_status', new.verified)::text);
      when 'TwitterUsers' then
        PERFORM pg_notify('on_social_media_update', json_build_object('platform', 'twitter', 'user_id', new.blockchainUserId, 'old_verified_status', old.verified, 'new_verified_status', new.verified)::text);
      else
        return null;
    end case;
    return null;
  end; 
  $function$
`

const createOnSocialMediaInstagramTrigger = `
  CREATE TRIGGER social_media_instagram_update_trigger
  AFTER UPDATE
  ON public.InstagramUsers
  FOR EACH ROW
  EXECUTE FUNCTION public.on_social_media_update();
`

const createOnSocialMediaTikTokTrigger = `
  CREATE TRIGGER social_media_tiktok_update_trigger
  AFTER UPDATE
  ON public.TikTokUsers
  FOR EACH ROW
  EXECUTE FUNCTION public.on_social_media_update();
`

const createOnSocialMediaTwitterTrigger = `
  CREATE TRIGGER social_media_twitter_update_trigger
  AFTER UPDATE
  ON public.TwitterUsers
  FOR EACH ROW
  EXECUTE FUNCTION public.on_social_media_update();
`

const dropSocialMediaInstagramTrigger =
  'drop trigger if exists social_media_instagram_update_trigger on InstagramUsers;'

const dropSocialMediaTwitterTrigger =
  'drop trigger if exists social_media_twitter_update_trigger on TwitterUsers;'

const dropSocialMediaTikTokTrigger =
  'drop trigger if exists social_media_tiktok_update_trigger on TikTokUsers;'

export const identityDb = knex({
  client: 'pg',
  // connect to discovery
  connection:
    process.env.audius_db_url ||
    'postgresql://postgres:postgres@localhost:5432/discovery_provider_1',
  pool: { min: 2, max: 10 },
  // debug: true,
  acquireConnectionTimeout: 120000
})

export const initializeIdentityTriggers = async () => {
  // create or update trigger
  await db.raw(onSocialMediaUpdateFunction)

  // run in serial to avoid deadloacks
  await db.raw(dropSocialMediaInstagramTrigger)
  await db.raw(dropSocialMediaTwitterTrigger)
  await db.raw(dropSocialMediaTikTokTrigger)

  await db.raw(createOnSocialMediaInstagramTrigger)
  await db.raw(createOnSocialMediaTikTokTrigger)
  await db.raw(createOnSocialMediaTwitterTrigger)
}
