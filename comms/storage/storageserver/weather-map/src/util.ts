export function shortenUrl(url: string) {
  if (url.startsWith('https://')) return url.substring('https://'.length)
  if (url.startsWith('http://')) return url.substring('http://'.length)
  return url
}

export function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export function formatDateTime(date: Date) {
  const today = new Date()
  if (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  ) {
    return date.toLocaleTimeString()
  }
  return date.toLocaleString()
}
