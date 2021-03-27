import { useMemo } from 'react'
import { isMobile } from 'utils/clientUtil'
import cn from 'classnames'
import { ClassValue } from 'classnames/types'

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
