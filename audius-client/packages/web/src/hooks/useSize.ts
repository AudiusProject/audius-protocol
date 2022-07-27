import { useState, useEffect, MutableRefObject, useCallback } from 'react'

import { Nullable } from '@audius/common'

type UseSizeProps = {
  ref: MutableRefObject<Nullable<HTMLElement>>
  /** Use the size of the border box (includes border and padding) rather than content box (does not include border or padding) */
  useBorderBox?: boolean
  /** Use the inline size (width) rather than block size (height) */
  useInlineSize?: boolean
}
/**
 * Gets the size of the given element using a ResizeObserver
 */
export const useSize = ({
  ref,
  useBorderBox = false,
  useInlineSize = false
}: UseSizeProps) => {
  const [size, setSize] = useState(0)
  const handleResize = useCallback(
    (entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        if (ref?.current) {
          const boxSize = useBorderBox
            ? entry.borderBoxSize[0]
            : entry.contentBoxSize[0]
          const newSize = useInlineSize ? boxSize.inlineSize : boxSize.blockSize
          if (size !== newSize) {
            setSize(newSize)
          }
        }
      }
    },
    [ref, size, useBorderBox, useInlineSize]
  )

  useEffect(() => {
    const observer = new ResizeObserver(handleResize)
    if (ref.current) {
      observer.observe(ref.current)
    }
    return () => {
      observer.disconnect()
    }
  }, [ref, handleResize])

  return size
}
