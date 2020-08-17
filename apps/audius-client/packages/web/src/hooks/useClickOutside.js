import { useEffect, useRef } from 'react'

/**
 * Custom hook that fires an onClick callback when the user clicks
 * outside of the element referenced by the returned ref.
 *
 * @param {function} onClick the callback fired when a click is performed "outside"
 * @returns a ref that should be used to mark the "inside" element
 */
const useClickOutside = onClick => {
  const ref = useRef(null)

  useEffect(() => {
    const handleClick = e => {
      if (!ref.current || (ref.current && ref.current.contains(e.target)))
        return
      onClick()
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClick])

  return ref
}

export default useClickOutside
