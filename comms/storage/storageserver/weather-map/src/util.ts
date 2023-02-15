export function shortenUrl(url: string) {
  if (url.startsWith('https://')) return url.substring('https://'.length)
  if (url.startsWith('http://')) return url.substring('http://'.length)
  return url
}

export function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}
