import { dialPg } from '../etl/conn'

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

  const count = await client.query(`
    SELECT count(*)
    FROM information_schema.routines
    WHERE routine_name = '${functionName}';`)

  if (count.rows[0].count == 1) {
    console.log(`function ${functionName} already exists... skipping`)
  } else {
    const tables = [
      'follows',
      'reposts',
      'saves',
      'tracks',
      'users',
      'playlists',
    ]

    // drop existing triggers
    await Promise.all(
      tables.map((t) =>
        client.query(`drop trigger if exists trg_${t} on ${t};`)
      )
    )

    // create function
    await client.query(trigger)

    // create triggers
    if (process.argv[2] !== 'drop') {
      await Promise.all(
        tables.map((t) =>
          client.query(`
          create trigger trg_${t}
            after insert on ${t}
            for each row execute procedure ${functionName}();`)
        )
      )
    }
  }

  client.release()
}
