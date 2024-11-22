import { useState, useEffect, useCallback } from 'react'

import { Collection, SquareSizes, Track } from '~/models'
import { Maybe } from '~/utils/typeUtils'

// Global image cache
const IMAGE_CACHE = new Set<string>()

/**
 * Fetches an image from the given artwork object managing sizes and using fallback mirrors if necessary.
 *  - If a larger image has already been fetched and is in the case, use it instead
 *  - If a smaller image has already been fetched and is in the cache, use it while fetching the larger one
 *  - If fetching a given image fails, substitute out mirrors and try again
 * @param artwork - The artwork object to fetch from
 * @param targetSize - The desired size of the image
 * @param defaultImage - The fallback image to use if no image is found in the `artwork` object
 * @returns The url of the image, or undefined if the image is not available
 */
export const useImageSize2 = ({
  artwork,
  targetSize,
  defaultImage,
  preloadImageFn
}: {
  artwork?: Track['artwork'] | Collection['artwork']
  targetSize: SquareSizes
  defaultImage: string
  preloadImageFn: (url: string) => Promise<void>
}) => {
  const [imageUrl, setImageUrl] = useState<Maybe<string>>(undefined)

  const fetchWithFallback = useCallback(
    async (url: string) => {
      const mirrors = [...(artwork?.mirrors ?? [])]
      let currentUrl = url

      while (mirrors.length > 0) {
        try {
          await preloadImageFn(currentUrl)
          return currentUrl
        } catch {
          const nextMirror = mirrors.shift()
          if (!nextMirror) throw new Error('No mirror found')
          const nextUrl = new URL(currentUrl)
          nextUrl.hostname = new URL(nextMirror).hostname
          currentUrl = nextUrl.toString()
        }
      }

      throw new Error(`Failed to fetch image from all mirrors ${url}`)
    },
    [artwork?.mirrors, preloadImageFn]
  )

  const resolveImageUrl = useCallback(async () => {
    if (!artwork) {
      console.debug(`useImageSize: no artwork, loading`)
      return
    }
    const targetUrl = artwork[targetSize]
    if (!targetUrl) {
      console.debug(`useImageSize: no target url for ${targetSize}`)
      setImageUrl(defaultImage)
      return
    }

    if (IMAGE_CACHE.has(targetUrl)) {
      console.debug(`useImageSize: cache hit ${targetUrl}`)
      setImageUrl(targetUrl)
      return
    }

    // Check for smaller size in the cache
    // If found, set the image url and preload the actual target url
    const smallerSize = Object.keys(artwork).find(
      (size) =>
        parseInt(size) < parseInt(targetSize) &&
        artwork[size as SquareSizes] &&
        IMAGE_CACHE.has(artwork[size as SquareSizes]!)
    ) as SquareSizes | undefined

    // Check for larger size
    // If found, set the image url to the larger size and return
    const largerSize = Object.keys(artwork).find(
      (size) =>
        parseInt(size) > parseInt(targetSize) &&
        artwork[size as SquareSizes] &&
        IMAGE_CACHE.has(artwork[size as SquareSizes]!)
    ) as SquareSizes | undefined

    if (largerSize) {
      console.debug(
        `useImageSize: cache miss, found larger ${targetUrl} ${largerSize}`
      )
      setImageUrl(artwork[largerSize])
      return
    }

    if (smallerSize) {
      console.debug(
        `useImageSize: cache miss, found smaller ${targetUrl} ${smallerSize}`
      )
      setImageUrl(artwork[smallerSize])
      const finalUrl = await fetchWithFallback(targetUrl)
      IMAGE_CACHE.add(finalUrl)
      setImageUrl(finalUrl)
      return
    }

    // Fetch image with fallback mirrors
    try {
      console.debug(`useImageSize: cache miss fetch original ${targetUrl}`)
      const finalUrl = await fetchWithFallback(targetUrl)
      IMAGE_CACHE.add(finalUrl)
      setImageUrl(finalUrl)
    } catch (e) {
      console.error(`Unable to load image ${targetUrl} after retries: ${e}`)
    }
  }, [artwork, targetSize, fetchWithFallback, defaultImage])

  useEffect(() => {
    resolveImageUrl()
  }, [resolveImageUrl])

  return imageUrl
}
