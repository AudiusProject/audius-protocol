/* globals Image */
import { useEffect, useState } from 'react'

export const useOnResizeEffect = handleResize => {
  return useEffect(() => {
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [handleResize])
}

export const useOnImageLoad = (url, loading) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  useEffect(() => {
    setImageLoaded(false)
    if (url) {
      const img = new Image()
      img.onload = () => {
        setImageLoaded(true)
      }
      img.src = url
    } else if (loading) {
      setImageLoaded(false)
    } else {
      setImageLoaded(true)
    }
    return () => {}
  }, [url, loading])
  return imageLoaded
}
