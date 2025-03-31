import { Client, Notification } from 'pg'
import { logger } from './logger'
import { NotificationRow } from './types/dn'

export class PendingUpdates {
  appNotifications: Array<NotificationRow> = []

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

  handler = (notification: NotificationRow) => {
    this.pending.appNotifications.push(notification)
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

    this.client.on('notification', async (msg: Notification) => {
      // Only process events from notification table
      if (msg.channel !== 'notification') return
      const { notification_id }: { notification_id: number } = JSON.parse(
        msg.payload
      )
      const notification = await getNotification(this.client, notification_id)
      if (notification !== null) {
        this.handler(notification)
      }
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

const getNotification = async (
  client: Client,
  notificationId: number
): Promise<NotificationRow | null> => {
  const query = 'SELECT * FROM notification WHERE id = $1 limit 1;'
  const values = [notificationId] // parameterized query
  try {
    const res = await client.query<NotificationRow>(query, values)
    return res.rows[0]
  } catch (e) {
    logger.error(`could not get notification ${notificationId} ${e}`)
    return null
  }
}
