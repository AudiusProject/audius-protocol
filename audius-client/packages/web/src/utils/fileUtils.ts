// convert a base64 string to a file object
export const dataURLtoFile = (dataUrl: string) => {
  const arr = dataUrl.split(',')
  const bstr = atob(arr[1])
  const n = bstr.length
  const u8arr = new Uint8Array(n)
  ;[...Array(n)].forEach((_, i) => (u8arr[i] = bstr.charCodeAt(i)))
  return new File([u8arr], 'Artwork', { type: 'image/jpeg' })
}
