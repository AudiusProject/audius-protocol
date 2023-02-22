import sg, { MailService } from '@sendgrid/mail'
import { logger } from './logger'

export const getSendgrid = (): MailService | null => {
  const sendgridApiKey = process.env.SENDGRID_API_KEY
  if (!sendgridApiKey) {
    logger.error('Sendgrid API Key not set')
    return null
  }
  sg.setApiKey(sendgridApiKey)
  return sg
}
