export const getTwitterLink = (url: string | null, text: string) => {
  const textString = `?text=${encodeURIComponent(text)}`
  const urlString = url ? `&url=${encodeURIComponent(url)}` : ''

  return `http://twitter.com/share${textString}${urlString}`
}
