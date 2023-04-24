export function HealthLink({ endpoint }: { endpoint?: string }) {
  if (!endpoint) return null
  const url = new URL(endpoint)
  return (
    <a href={endpoint + '/health_check'} target="_blank">
      {url.host}
    </a>
  )
}

export function RelTime({ date }: { date: Date | string }) {
  if (!date) return null
  if (typeof date == 'string') {
    date = new Date(date)
  }
  return (
    <span title={date.toLocaleString()}>
      <b>{timeSince(date)}</b> ago
    </span>
  )
}

function timeSince(date: Date) {
  const now = new Date()
  var seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  var interval = seconds / 31536000

  if (interval > 1) {
    return Math.floor(interval) + ' years'
  }
  interval = seconds / 2592000
  if (interval > 1) {
    return Math.floor(interval) + ' months'
  }
  interval = seconds / 86400
  if (interval > 1) {
    return Math.floor(interval) + ' days'
  }
  interval = seconds / 3600
  if (interval > 1) {
    return Math.floor(interval) + ' hours'
  }
  interval = seconds / 60
  if (interval > 1) {
    return Math.floor(interval) + ' minutes'
  }
  return Math.floor(seconds) + ' seconds'
}
