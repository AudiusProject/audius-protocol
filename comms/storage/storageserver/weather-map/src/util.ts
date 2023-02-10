export function getStorageHostFromNatsHost(natsHost: string) {
  const natsPort = natsHost.slice(-4)
  // Convert natsPort from string to number, add 1000, and convert back to string
  const storageApiPort = parseInt(natsPort, 10) + 1000
  return `http://localhost:${storageApiPort}`
}

export function shortenUrl(url: string) {
  if (url.startsWith('https://')) return url.substring('https://'.length)
  if (url.startsWith('http://')) return url.substring('http://'.length)
  return url
}

export function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}
