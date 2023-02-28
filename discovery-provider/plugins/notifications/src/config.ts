export const config = {
  // Delay (in ms) in sending notifications for unread messages
  // dmNotificationDelay: 300000,
  // NOTE: Temp to test in staging
  // TODO remove
  dmNotificationDelay: 500,
  // ms between jobs
  pollInterval: 500,
  lastIndexedMessageRedisKey: 'latestDMNotificationTimestamp',
  lastIndexedReactionRedisKey: 'latestDMReactionNotificationTimestamp'
}
