import { useMemo } from 'react'

import cn from 'classnames'
// TODO: Investigate why this import breaks no-unresolved
// eslint-disable-next-line
import { ClassValue } from 'classnames/types'

import { useIsMobile } from 'hooks/useIsMobile'

/**
 * Wraps classnames and applies a mobile class as needed.
 * Example:
 * ```
 *  const wm = useWithMobile(styles.mobile)
 *  // later
 *  <div className={wm(styles.class1, styles.class2)}
 * ```
 */
export const useWithMobileStyle = (mobileClassName: string) => {
  const isMobile = useIsMobile()

  const withMobile = useMemo(() => {
    const mobileStyle = { [mobileClassName]: isMobile }
    return (...classnames: ClassValue[]) => cn(...classnames, mobileStyle)
  }, [isMobile, mobileClassName])

  return withMobile
}
