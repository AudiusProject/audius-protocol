import { dialPg } from './conn'
import { logger } from './logger'

export const LISTEN_TABLES = [
  'aggregate_plays',
  'aggregate_user',
  'follows',
  'playlists',
  'reposts',
  'saves',
  'tracks',
  'users',
]

const functionName = `on_new_row`

const trigger = `
create or replace function ${functionName}() returns trigger as $$
begin
  case TG_TABLE_NAME
    when 'tracks' then
      PERFORM pg_notify(TG_TABLE_NAME, json_build_object('track_id', new.track_id)::text);
    when 'users' then
      PERFORM pg_notify(TG_TABLE_NAME, json_build_object('user_id', new.user_id)::text);
    when 'playlists' then
      PERFORM pg_notify(TG_TABLE_NAME, json_build_object('playlist_id', new.playlist_id)::text);
    else
      PERFORM pg_notify(TG_TABLE_NAME, to_json(new)::text);
  end case;
  return null;
end; 
$$ language plpgsql;
`

export async function setupTriggers() {
  const client = await dialPg().connect()
  const tables = LISTEN_TABLES

  // create function
  logger.info(`creating plpgsql function`)
  await client.query(trigger)

  // create triggers
  logger.info({ tables }, `creating triggers`)
  await Promise.all(tables.map(createTrigger))

  async function createTrigger(tableName: string) {
    logger.info({ tableName, functionName }, `creating trigger`)
    client.query(`
      do $$ begin
        create trigger trg_${tableName}
        after insert or update on ${tableName}
        for each row execute procedure ${functionName}();
      exception
        when others then null;
      end $$;
    `)
  }

  client.release()
}
