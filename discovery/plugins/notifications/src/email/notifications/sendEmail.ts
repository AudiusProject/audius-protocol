import { renderEmail } from './renderEmail'

import { EmailNotification } from '../../types/notifications'
import { logger } from '../../logger'
import { getSendgrid } from '../../sendgrid'
import { MailDataRequired } from '@sendgrid/mail'
import { Knex } from 'knex'
import {
  EmailFrequency,
  UserNotificationSettings
} from '../../processNotifications/mappers/userNotificationSettings'

// Sendgrid object

type SendNotificationEmailProps = {
  userId: number
  email: string
  frequency: EmailFrequency
  notifications: EmailNotification[]
  dnDb: Knex
  identityDb: Knex
  sendAt?: number // unix timestamp in seconds
  timezone?: string
}

// Set of notifications that we do NOT send out emails for
// NOTE: This is to match parity with what identity does
const notificationsWithoutEmail = new Set([
  'supporter_dethroned',
  'tier_change',
  'tip_send'
])

// Master function to render and send email for a given userId
export const sendNotificationEmail = async ({
  userId,
  email,
  frequency,
  notifications,
  dnDb,
  identityDb,
  sendAt,
  timezone
}: SendNotificationEmailProps) => {
  if (email === undefined) {
    return
  }
  try {
    logger.debug(`SendNotificationEmail | ${userId}, ${email}, ${frequency}`)
    const validNotifications = notifications.filter(
      (n) => !notificationsWithoutEmail.has(n.type)
    )
    const notificationCount = validNotifications.length
    const emailSubject = `${notificationCount} unread notification${
      notificationCount > 1 ? 's' : ''
    } on Audius`
    if (notificationCount === 0) {
      logger.debug(
        `renderAndSendNotificationEmail | 0 notifications detected for user ${userId}, bypassing email`
      )
      return false
    }

    const notifHtml = await renderEmail({
      userId,
      email,
      frequency,
      notifications: validNotifications,
      dnDb,
      identityDb,
      timezone
    })

    const emailParams: MailDataRequired = {
      from: 'Audius <notify@audius.co>',
      to: `${email}`,
      bcc: 'audius-email-test@audius.co',
      html: notifHtml,
      subject: emailSubject,
      asm: {
        groupId: 19141 // id of unsubscribe group at https://mc.sendgrid.com/unsubscribe-groups
      }
    }

    if (sendAt) {
      emailParams.sendAt = sendAt
    }

    // Send email
    await sendEmail(emailParams)

    logger.info(
      {
        job: 'renderAndSendNotificationEmail'
      },
      `renderAndSendNotificationEmail | sent email to ${userId} at ${email}`
    )
    return true
  } catch (e) {
    logger.error(`Error in renderAndSendNotificationEmail ${e.stack}`)
    return false
  }
}

export const sendEmail = async (emailParams: MailDataRequired) => {
  const sg = getSendgrid()
  if (sg !== null) {
    await sg.send(emailParams)
  }
}
