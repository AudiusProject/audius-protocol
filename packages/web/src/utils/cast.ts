export const makeWarpcastShareUrl = (url: string | null, text: string) => {
  const textString = `${encodeURIComponent(text)}`
  const urlString = url ? `${encodeURIComponent(url)}` : ''

  return `https://warpcast.com/~/compose?text=${textString}&embeds[]=${urlString}`
}

export const openWarpcastLink = (url: string | null, text: string) => {
  const farcasterShareLink = makeWarpcastShareUrl(url, text)

  window.open(
    farcasterShareLink,
    '',
    'left=0,top=0,width=550,height=450,personalbar=0,toolbar=0,scrollbars=0,resizable=0'
  )
}
