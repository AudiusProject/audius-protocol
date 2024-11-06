import { useState, useEffect, useCallback } from 'react'

import { SquareSizes, Track } from '~/models'
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
  defaultImage
}: {
  artwork: Maybe<Track['artwork']>
  targetSize: SquareSizes
  defaultImage: string
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const preloadImage = (url: string) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.src = url
      img.onload = () => resolve(url)
      img.onerror = () => reject(url)
    })
  }

  const fetchWithFallback = useCallback(
    async (url: string) => {
      const mirrors = [...(artwork?.mirrors ?? [])]
      let currentUrl = url

      while (mirrors.length > 0) {
        try {
          await preloadImage(currentUrl)
          return currentUrl
        } catch {
          const nextMirror = mirrors.shift()
          if (!nextMirror) throw new Error('No mirror found')
          const currentHost = new URL(currentUrl).hostname
          const nextHost = new URL(nextMirror).hostname
          const newUrl = currentUrl.replace(currentHost, nextHost)
          currentUrl = newUrl
        }
      }

      throw new Error('Failed to fetch image from all mirrors')
    },
    [artwork?.mirrors]
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
      setImageUrl(artwork[largerSize] ?? null)
      return
    }

    if (smallerSize) {
      console.debug(
        `useImageSize: cache miss, found smaller ${targetUrl} ${smallerSize}`
      )
      setImageUrl(artwork[smallerSize] ?? null)
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
    } catch {
      console.error(`Unable to load image ${targetUrl} after retries`)
    }
  }, [artwork, targetSize, fetchWithFallback, defaultImage])

  useEffect(() => {
    resolveImageUrl()
  }, [resolveImageUrl])

  return imageUrl ?? undefined
}
