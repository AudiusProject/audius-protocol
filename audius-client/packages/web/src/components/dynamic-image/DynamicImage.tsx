import React, { memo, ReactNode, useEffect, useRef, RefObject } from 'react'

import cn from 'classnames'

import transparentPlaceholderImg from 'assets/img/1x1-transparent.png'
import useInstanceVar from 'common/hooks/useInstanceVar'

import styles from './DynamicImage.module.css'

const placeholder =
  'linear-gradient(315deg, var(--neutral-light-8) 0%, var(--neutral-light-9) 100%)'

export type DynamicImageProps = {
  // Image URL (or style.backgroundImage)
  image?: string
  // Whether or not the image is a full URL. This can be set to false
  // and the image prop is treated as the entire style.backgroundImage
  isUrl?: boolean
  // If no image is not present, what should we fade it in from?
  initialOpacity?: number
  // Classes to apply to the wrapper
  wrapperClassName?: string
  // Classes to apply to the image itself
  className?: string
  // Styles to apply to the image itself
  imageStyle?: object
  // Whether or not to immediately animate
  immediate?: boolean
  // Immediately removes animating-out images
  immediatelyLeave?: boolean
  // Whether or not to use the default placeholder
  usePlaceholder?: boolean

  children?: ReactNode
  onClick?: () => void
}

const moveBehind = (ref: RefObject<HTMLDivElement>) => {
  if (ref.current) {
    ref.current.style.animation = 'none'
    ref.current.style.zIndex = '1'
    ref.current.style.backgroundColor = 'unset'
  }
}

const fadeIn = (
  ref: RefObject<HTMLDivElement>,
  isUrl: boolean,
  image: string,
  immediate: boolean
) => {
  if (ref.current) {
    ref.current.style.zIndex = '2'

    if (image === placeholder) {
      ref.current.style.backgroundColor = 'unset'
      ref.current.style.backgroundImage = `${image}`
      ref.current.style.transition = 'unset'
      ref.current.style.opacity = '1'
      return
    }

    // Set default background color for static images (transparent background defaults)
    if (image.includes('/static')) {
      ref.current.style.backgroundColor = 'var(--neutral-light-5)'
    } else if (!image.startsWith('data:image/png')) {
      ref.current.style.backgroundColor = 'unset'
    }
    // Allow gradient values for 'image' in addition to URIs
    ref.current.style.backgroundImage = image.includes('linear-gradient(')
      ? `${image}`
      : isUrl
      ? `url(${image})`
      : image
    ref.current.style.transition = `opacity ${
      immediate ? '0.1s' : '0.5s'
    } ease-in-out`
    ref.current.style.opacity = '1'
  }
}

/**
 * A dynamic image that transitions between changes to the `image` prop.
 */
const DynamicImage = ({
  image,
  isUrl,
  wrapperClassName,
  className,
  imageStyle,
  immediate,
  children,
  onClick,
  usePlaceholder = true
}: DynamicImageProps) => {
  const first = useRef<HTMLDivElement>(null)
  const second = useRef<HTMLDivElement>(null)
  const [getIsFirstActive, setIsFirstActive] = useInstanceVar(true)

  const [getPrevImage, setPrevImage] = useInstanceVar('') // no previous image

  // The actual image to display (maybe placeholder)
  let displayImage: string
  if (usePlaceholder) {
    displayImage = image || placeholder
  } else {
    displayImage = image || transparentPlaceholderImg
  }

  useEffect(() => {
    if (first.current && second.current) {
      // Not the first time the image is loading and the image hasn't changed
      if (getPrevImage() !== '' && getPrevImage() === displayImage) {
        return
      }
      setPrevImage(displayImage)

      if (getIsFirstActive()) {
        moveBehind(second)
        fadeIn(
          first,
          !!isUrl,
          displayImage,
          !!immediate || displayImage === placeholder
        )

        setIsFirstActive(false)
      } else {
        moveBehind(first)
        fadeIn(second, !!isUrl, displayImage, !!immediate)

        setIsFirstActive(true)
      }
    }
  }, [
    isUrl,
    displayImage,
    first,
    second,
    getPrevImage,
    setPrevImage,
    getIsFirstActive,
    setIsFirstActive,
    immediate
  ])

  return (
    <div className={cn(styles.wrapper, wrapperClassName)}>
      <div
        ref={first}
        className={cn(styles.image, className)}
        style={imageStyle}
        onClick={onClick}
      />
      <div
        ref={second}
        className={cn(styles.image, className)}
        style={imageStyle}
        onClick={onClick}
      />
      {children && <div className={styles.children}>{children}</div>}
    </div>
  )
}

DynamicImage.defaultProps = {
  isUrl: true,
  immediate: false
}

export default memo(DynamicImage)
