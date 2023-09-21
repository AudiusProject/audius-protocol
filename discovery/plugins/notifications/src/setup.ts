import { Knex } from 'knex'
import { logger } from './logger'

const functionName = `on_new_notification_row`

const trigger = `
create or replace function ${functionName}() returns trigger as $$
begin
  PERFORM pg_notify(TG_TABLE_NAME, json_build_object('notification_id', new.id)::text);
  return null;
end; 
$$ language plpgsql;
`

export async function setupTriggers(db: Knex) {
  const { count }: { count: string } = await db('information_schema.routines')
    .where('routine_name', '=', functionName)
    .count({ count: '*' })

  const skip = parseInt(count) == 1

  if (skip) {
    logger.info(`function ${functionName} already exists... skipping`)
  } else {
    // drop existing triggers
    logger.info(`dropping any existing triggers`)
    await db.raw(`drop trigger if exists trg_notification on notification;`)

    // create function
    logger.info(`creating plpgsql function`)
    await db.raw(trigger)

    // create triggers
    logger.info(`creating triggers`)
    if (process.argv[2] !== 'drop') {
      await db.raw(`
        create trigger trg_notification
          after insert on notification
          for each row execute procedure ${functionName}();`)
    }
  }
}
