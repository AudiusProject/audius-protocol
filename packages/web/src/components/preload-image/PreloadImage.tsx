import React, { useEffect, useState } from 'react'
import cn from 'classnames'

import styles from './PreloadImage.module.css'

// Simple preloader that resolves on load or on error
const preload = async (src: string) => {
  return new Promise(resolve => {
    const i = new Image()
    i.onload = resolve
    i.onerror = resolve
    i.src = src
  })
}

/** Super simple PreloadImage component to be used for fading in an image */
const PreloadImage = ({
  src,
  alt,
  className
}: {
  src: string
  alt: string
  className: string
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
      className={cn(styles.img, className, { [styles.isLoaded]: isLoaded })}
      alt={alt}
    />
  )
}

export default PreloadImage
