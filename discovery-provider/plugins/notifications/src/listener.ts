import { Knex } from 'knex'
import { Notification } from 'pg'
import { logger } from './logger'
import { NotificationRow } from './types/dn'

export class PendingUpdates {
  appNotifications: Array<NotificationRow> = []

  isEmpty(): boolean {
    return (
      this.appNotifications.length == 0
    )
  }
}

let pending = new PendingUpdates()

export function takePending() {
  if (pending.isEmpty()) return
  const p = pending
  pending = new PendingUpdates()
  return p
}

const handler = (row: NotificationRow) => {
  pending.appNotifications.push(row)
}

export async function startListener(db: Knex) {
  const sql = 'LISTEN notification;'
  const connection = await db.client.acquireConnection()
  connection.on('notification', (msg: Notification) => {
    const body = JSON.parse(msg.payload)
    handler(body)
  })

  await connection.query(sql)
  logger.info('LISTENER Started')
}
