import { Knex } from 'knex'
import { logger } from './logger'

const notificationFunctionName = `on_new_notification_row`
const notificationSeenFunctionName = `on_new_notification_seen_row`

const notificationTrigger = `
create or replace function ${notificationFunctionName}() returns trigger as $$
begin
  PERFORM pg_notify(TG_TABLE_NAME, json_build_object('notification_id', new.id)::text);
  return null;
end; 
$$ language plpgsql;
`

const notificationSeenTrigger = `
create or replace function ${notificationSeenFunctionName}() returns trigger as $$
begin
  PERFORM pg_notify(TG_TABLE_NAME, json_build_object('user_id', new.user_id)::text);
  return null;
end; 
$$ language plpgsql;
`

export async function setupTriggers(db: Knex) {
  // Setup notification trigger
  const { notificationCount }: { notificationCount: string } = await db(
    'information_schema.routines'
  )
    .where('routine_name', '=', notificationFunctionName)
    .count({ notificationCount: '*' })

  const skipNotification = parseInt(notificationCount) == 1

  if (skipNotification) {
    logger.info(
      `function ${notificationFunctionName} already exists... skipping`
    )
  } else {
    // drop existing triggers
    logger.info(`dropping any existing notification triggers`)
    await db.raw(`drop trigger if exists trg_notification on notification;`)

    // create function
    logger.info(`creating notification plpgsql function`)
    await db.raw(notificationTrigger)

    // create triggers
    logger.info(`creating notification triggers`)
    if (process.argv[2] !== 'drop') {
      await db.raw(`
        create trigger trg_notification
          after insert on notification
          for each row execute procedure ${notificationFunctionName}();`)
    }
  }

  // Setup notification_seen trigger
  const { notificationSeenCount }: { notificationSeenCount: string } = await db(
    'information_schema.routines'
  )
    .where('routine_name', '=', notificationSeenFunctionName)
    .count({ notificationSeenCount: '*' })

  const skipNotificationSeen = parseInt(notificationSeenCount) == 1

  if (skipNotificationSeen) {
    logger.info(
      `function ${notificationSeenFunctionName} already exists... skipping`
    )
  } else {
    // drop existing triggers
    logger.info(`dropping any existing notification_seen triggers`)
    await db.raw(
      `drop trigger if exists trg_notification_seen on notification_seen;`
    )

    // create function
    logger.info(`creating notification_seen plpgsql function`)
    await db.raw(notificationSeenTrigger)

    // create triggers
    logger.info(`creating notification_seen triggers`)
    if (process.argv[2] !== 'drop') {
      await db.raw(`
        create trigger trg_notification_seen
          after insert on notification_seen
          for each row execute procedure ${notificationSeenFunctionName}();`)
    }
  }
}
