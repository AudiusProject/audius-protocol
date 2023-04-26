import { Client, Notification } from 'pg'
import { logger } from './logger'
import { NotificationRow } from './types/dn'

export class PendingUpdates {
  appNotifications: Array<number> = []

  isEmpty(): boolean {
    return this.appNotifications.length == 0
  }
}

export class Listener {
  pending: PendingUpdates = new PendingUpdates()
  connectionString: string
  client: Client

  takePending = () => {
    if (this.pending.isEmpty()) return
    const p = this.pending
    this.pending = new PendingUpdates()
    return p
  }

  handler = (notificationId: number) => {
    this.pending.appNotifications.push(notificationId)
  }

  start = async (connectionString: string) => {
    this.connectionString = connectionString

    this.client = new Client({
      connectionString,
      application_name: 'notifications'
    })
    logger.info('made client')
    await this.client.connect()
    logger.info('did connect')

    this.client.on('notification', (msg: Notification) => {
      const body = JSON.parse(msg.payload)
      this.handler(body)
    })

    const sql = 'LISTEN notification;'
    await this.client.query(sql)
    logger.info('LISTENER Started')
  }

  close = async () => {
    await this.client?.end()
    this.client = null
  }
}
