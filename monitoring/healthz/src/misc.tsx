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

export function timeSince(date: Date) {
  if (!date || date.toString() === "0001-01-01T00:00:00Z") return null
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  return secondsToReadableDuration(seconds)
}

export function nanosToReadableDuration(nanos: number) {
  const seconds = nanos / 1e9  // Convert nanoseconds to seconds
  return secondsToReadableDuration(seconds)
}

function secondsToReadableDuration(seconds: number) {
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
