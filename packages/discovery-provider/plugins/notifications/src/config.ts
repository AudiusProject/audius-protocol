export const config = {
  // Delay (in ms) in sending notifications for unread messages
  dmNotificationDelay: 500,
  // ms between jobs
  pollInterval: 500,
  lastIndexedMessageRedisKey: 'latestDMNotificationTimestamp',
  lastIndexedReactionRedisKey: 'latestDMReactionNotificationTimestamp'
}
