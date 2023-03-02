export const makeTwitterShareUrl = (url: string | null, text: string) => {
  const textString = `?text=${encodeURIComponent(text)}`
  const urlString = url ? `&url=${encodeURIComponent(url)}` : ''

  return `http://twitter.com/intent/tweet${textString}${urlString}`
}
