export const preload = (url: string) => {
  return new Promise<void>((resolve, reject) => {
    const img = new Image()
    img.src = url
    img.onload = () => resolve()
    img.onerror = () => reject(new Error(`Failed to load ${url}`))
  })
}
