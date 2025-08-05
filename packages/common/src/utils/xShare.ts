export const makeXShareUrl = (url: string | null, text: string) => {
  const textString = `?text=${encodeURIComponent(text)}`
  const urlString = url ? `&url=${encodeURIComponent(url)}` : ''

  return `http://x.com/intent/tweet${textString}${urlString}`
}
