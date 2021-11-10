import { useMemo } from 'react'

import cn from 'classnames'
// TODO: Investigate why this import breaks no-unresolved
// eslint-disable-next-line
import { ClassValue } from 'classnames/types'

import { isMobile } from 'utils/clientUtil'

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
  const mobile = isMobile()

  const withMobile = useMemo(() => {
    const mobileStyle = { [mobileClassName]: mobile }
    return (...classnames: ClassValue[]) => cn(...classnames, mobileStyle)
  }, [mobile, mobileClassName])

  return withMobile
}
