// Simple preloader that resolves on image load or on error
export const preload = async (src: string) => {
  return new Promise((resolve) => {
    const i = new Image()
    i.onload = resolve
    i.onerror = resolve
    i.src = src
  })
}
