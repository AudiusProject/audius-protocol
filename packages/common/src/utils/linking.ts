export const externalLinkAllowList = new Set([
  'facebook.com',
  'instagram.com',
  'tiktok.com',
  'twitter.com',
  'x.com',
  'audius.co',
  'discord.gg'
])

export const isAllowedExternalLink = (link: string) => {
  try {
    let hostname = new URL(link).hostname
    hostname = hostname.replace(/^www\./, '')
    return externalLinkAllowList.has(hostname)
  } catch (e) {
    return false
  }
}
