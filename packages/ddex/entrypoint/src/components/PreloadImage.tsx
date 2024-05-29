import { CSSProperties, useEffect, useState } from 'react'

const preload = async (src: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const i = new Image()
    i.onload = () => resolve(true)
    i.onerror = () => resolve(true)
    i.src = src
  })
}

export const PreloadImage = ({
  src,
  alt = '',
  height,
  width,
  style
}: {
  src: string
  alt?: string
  height?: string
  width?: string,
  style?: CSSProperties
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  useEffect(() => {
    const load = async () => {
      await preload(src)
      setIsLoaded(true)
    }
    load()
  }, [setIsLoaded, src])
  return (
    <img
      src={src}
      alt={alt}
      height={height}
      width={width}
      style={{
        ...style,
        transition: 'opacity 0.3s ease-in-out',
        opacity: isLoaded ? 1 : 0
      }}
    />
  )
}
