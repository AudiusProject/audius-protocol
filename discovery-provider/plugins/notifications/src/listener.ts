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


export class Listener {
  pending: PendingUpdates = new PendingUpdates()
  db: Knex
  connection: any

  takePending = () => {
    if (this.pending.isEmpty()) return
    const p = this.pending
    this.pending = new PendingUpdates()
    return p
  }

  handler = (row: NotificationRow) => {
    this.pending.appNotifications.push(row)
  }

  start = async (db: Knex) => {
    this.db = db
    const sql = 'LISTEN notification;'
    this.connection = await db.client.acquireConnection()
    this.connection.on('notification', (msg: Notification) => {
      const body = JSON.parse(msg.payload)
      this.handler(body)
    })

    await this.connection.query(sql)
    logger.info('LISTENER Started')
  }


  close = async () => {
    if (this.db) {
      await this.db.client.releaseConnection(this.connection)
      this.db = null
    }
  }
}
