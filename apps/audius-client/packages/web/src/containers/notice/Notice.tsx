import React, { ReactNode, useCallback, useEffect, useState } from 'react'
import cn from 'classnames'
import { useRemoteVar } from 'containers/remote-config/hooks'
import { BooleanKeys } from 'services/remote-config'

import styles from './Notice.module.css'
import { IconRemove } from '@audius/stems'

const messages = {
  degradedFunctionality:
    'We’re experiencing heavy load! Some functionality may be degraded. Please try again later.'
}

const DegradedFunctionalityNotice = () => (
  <>
    <span>{messages.degradedFunctionality}</span>
    <i className='emoji heavy-black-heart' />
  </>
)

const Notice = ({ shouldPadTop }: { shouldPadTop: boolean }) => {
  const [isVisible, setIsVisible] = useState(false)
  const hide = useCallback(() => setIsVisible(false), [setIsVisible])

  const showDegradedFunctionality = useRemoteVar(
    BooleanKeys.NOTICE_DEGRADED_FUNCTIONALITY
  )
  let content: ReactNode = null
  if (showDegradedFunctionality) {
    content = <DegradedFunctionalityNotice />
  }

  useEffect(() => {
    if (showDegradedFunctionality) {
      setIsVisible(true)
    }
  }, [showDegradedFunctionality])

  return (
    <div
      className={cn(styles.notice, {
        [styles.show]: isVisible,
        [styles.shouldPadTop]: shouldPadTop
      })}
    >
      <div className={styles.content}>
        <IconRemove className={styles.iconRemove} onClick={hide} />
        {content}
      </div>
    </div>
  )
}

export default Notice
