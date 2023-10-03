import Knex from 'knex'
const { knex } = Knex

const trigger = `
  CREATE OR REPLACE FUNCTION public.on_track_upload()
  RETURNS trigger
  LANGUAGE plpgsql
  AS $function$
  BEGIN
    CASE TG_TABLE_NAME
      WHEN 'tracks' THEN
        IF new.updated_at = new.created_at THEN
          PERFORM pg_notify('track_upload', json_build_object('entity', TG_TABLE_NAME, 'created_at', new.created_at, 'updated_at', new.updated_at, 'track_id', new.track_id, 'user_id', new.owner_id)::text);
        END IF;
      ELSE
        RETURN NULL;
    END CASE;
    RETURN NULL;
  END;
  $function$
`

const createTracksTrigger = `
  CREATE TRIGGER tracks_create_trigger
  AFTER INSERT
  ON public.tracks
  FOR EACH ROW
  EXECUTE FUNCTION public.on_track_upload();
`

export const discoveryDb = knex({
  client: 'pg',
  // connect to discovery
  connection:
    process.env.audius_db_url ||
    'postgresql://postgres:postgres@localhost:5432/discovery_provider_1',
  pool: { min: 2, max: 10 },
  // debug: true,
  acquireConnectionTimeout: 120000
})

export const initializeTriggers = async () => {
  // create or update trigger
  await discoveryDb.raw(trigger)
  // drop and recreate trigger
  await discoveryDb.raw(
    'drop trigger if exists tracks_create_trigger on tracks;'
  )
  await discoveryDb.raw(createTracksTrigger)
}

export const listenForTrackUploads = async (onMsg) => {
  const connection = await discoveryDb.client.acquireConnection()
  connection.query('LISTEN track_upload')
  connection.on('notification', (msg) => {
    onMsg(msg)
  })
  // never ending promise so the listen stays alive
  await new Promise(() => {})
}
