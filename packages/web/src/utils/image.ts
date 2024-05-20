// Simple preloader that resolves on image load or on error
export const preload = async (src: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const i = new Image()
    i.onload = () => resolve(true)
    i.onerror = () => resolve(true)
    i.src = src
  })
}
