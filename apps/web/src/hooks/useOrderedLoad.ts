import { useState, useCallback, useEffect } from 'react'

/**
 * Helper hook to allow a parent to render children in order if the children
 * are responsible for loading themselves.
 * For example,
 *   const { isLoading, setDidLoad } = useOrderedLoad([item1, item2, item3])
 *   children.map(c =>
 *    // Child should use isLoading to show skeletons
 *    // Child should use hasLoading to signal to parent when it has loaded
 *    <Child isLoading={isLoading} setDidLoad={setDidLoad} />
 *   )
 */
export const useOrderedLoad = (length: number) => {
  const [loaded, setLoaded] = useState<boolean[]>([])

  const isLoading = useCallback(
    (index: number): boolean => {
      if (index === 0) return false
      if (index >= loaded.length) return true
      return !loaded[index - 1]
    },
    [loaded]
  )

  const setDidLoad = useCallback(
    (index: number) => {
      if (isLoading(index)) return false
      if (loaded[index] === false) {
        setLoaded((loaded) => {
          if (index >= loaded.length) return loaded
          const newLoaded = [...loaded]
          newLoaded[index] = true
          return newLoaded
        })
      }
    },
    [setLoaded, loaded, isLoading]
  )

  const updater = useCallback(
    (newLength: number) => {
      if (loaded.length < newLength) {
        setLoaded((loaded) => {
          const diff = newLength - loaded.length
          const append = new Array(diff).fill(false)
          return loaded.concat(append)
        })
      }
    },
    [loaded]
  )

  useEffect(() => {
    if (length) {
      updater(length)
    }
  }, [length, updater])

  return { isLoading, setDidLoad }
}
