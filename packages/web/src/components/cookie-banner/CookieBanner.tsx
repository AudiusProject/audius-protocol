import { memo } from 'react'

import { playerSelectors } from '@audius/common/store'

import cn from 'classnames'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import IconRemove from 'assets/img/iconRemove.svg'
import { useIsMobile } from 'hooks/useIsMobile'
import { dismissCookieBanner } from 'store/application/ui/cookieBanner/actions'
import { AppState } from 'store/types'
import { COOKIE_POLICY } from 'utils/route'

import styles from './CookieBanner.module.css'

const { getUid } = playerSelectors

const messages = {
  description:
    'We use cookies to make Audius work and to improve your experience. By using this site you agree to our',
  link: 'Privacy Policy.'
}

export type CookieBannerProps = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

export const CookieBanner = ({ isPlaying, dismiss }: CookieBannerProps) => {
  const isMobile = useIsMobile()
  const goToCookiePolicy = () => {
    const win = window.open(COOKIE_POLICY, '_blank')
    if (win) win.focus()
  }

  return (
    <div
      className={cn(styles.container, {
        [styles.isMobile]: isMobile,
        [styles.isPlaying]: isPlaying
      })}
    >
      <div className={styles.description}>
        {messages.description}
        <span className={styles.link} onClick={goToCookiePolicy}>
          {messages.link}
        </span>
      </div>
      <div className={styles.iconContainer} onClick={dismiss}>
        <IconRemove className={styles.iconRemove} />
      </div>
    </div>
  )
}

function mapStateToProps(state: AppState) {
  return {
    isPlaying: !!getUid(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    dismiss: () => dispatch(dismissCookieBanner())
  }
}

export default memo(connect(mapStateToProps, mapDispatchToProps)(CookieBanner))
