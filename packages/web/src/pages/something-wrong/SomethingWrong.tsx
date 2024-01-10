import React, { useCallback } from 'react'

import { Button, ButtonType } from '@audius/stems'
import cn from 'classnames'
import { useSelector } from 'react-redux'

import tiledBackground from 'assets/img/notFoundTiledBackround.png'
import { UiErrorCode } from 'store/errors/actions'
import { getIsErrorPageOpen, getUiErrorCode } from 'store/errors/selectors'
import { useIsMobile } from 'hooks/useIsMobile'
import { isDarkMode, isMatrix } from 'utils/theme/theme'
import zIndex from 'utils/zIndex'

import styles from './SomethingWrong.module.css'

const messages = {
  body1: 'We’re experiencing heavy load!',
  body2: 'Please try again later.',
  cta: 'Try Again'
}

const emojiMap: Record<UiErrorCode, React.ReactNode> = {
  [UiErrorCode.UNKNOWN]: <i className='emoji xl heavy-black-heart' />,
  [UiErrorCode.RELAY_BLOCKED]: <i className='emoji xl confused-face' />
}

export const SomethingWrong = () => {
  const isMobile = useIsMobile()
  // Select only once per mount
  const isOpen = useSelector(getIsErrorPageOpen)
  const uiErrorCode = useSelector(getUiErrorCode, () => true)

  const icon = emojiMap[uiErrorCode]

  const handleClickRetry = useCallback(() => {
    window.location.reload()
  }, [])

  return isOpen ? (
    <div
      className={cn(styles.somethingWrong, {
        [styles.isMobile]: isMobile
      })}
      style={{
        zIndex: zIndex.SOMETHING_WRONG_PAGE
      }}
    >
      <div
        className={styles.content}
        style={{
          backgroundImage: `url(${tiledBackground})`,
          backgroundBlendMode:
            isDarkMode() || isMatrix() ? 'color-burn' : 'none'
        }}
      >
        <div className={styles.body}>
          <div>{messages.body1}</div>
          <div>
            {messages.body2} {icon}
          </div>
        </div>
        <div className={styles.cta}>
          <Button
            className={styles.buttonFormatting}
            textClassName={styles.buttonText}
            type={ButtonType.PRIMARY_ALT}
            text={messages.cta}
            onClick={handleClickRetry}
          />
        </div>
      </div>
    </div>
  ) : null
}

export default SomethingWrong
